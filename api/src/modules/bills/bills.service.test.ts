import { openUpload, removeUpload, saveUpload } from '../../lib/uploads.ts';
import { billsRepository } from './bills.repository.ts';
import { addBill, deleteUnlinkedBills, getBillFile } from './bills.service.ts';

vi.mock('./bills.repository.ts', () => ({
  billsRepository: { create: vi.fn(), findById: vi.fn(), deleteUnlinkedBefore: vi.fn() },
}));

vi.mock('../../lib/uploads.ts', () => ({
  saveUpload: vi.fn(),
  openUpload: vi.fn(),
  removeUpload: vi.fn(),
}));

const FILE_NAME = '0c7d2e4a-8b1f-4e3c-a6d5-9f2b1c0e8a74.pdf';
const PDF_BILL = Buffer.from('%PDF-1.7\n%âãÏÓ\n');
const SAVED_ROW = {
  id: 9,
  fileName: FILE_NAME,
  fileType: 'PDF' as const,
  originalName: null,
  sizeBytes: PDF_BILL.length,
  createdAt: new Date('2026-11-03T09:00:00.000Z'),
  reading: null,
};

describe('addBill', () => {
  it('keeps the file under a new name with its own extension, then its row, and answers the bill when it is a PDF', async () => {
    vi.mocked(saveUpload).mockResolvedValueOnce(FILE_NAME);
    vi.mocked(billsRepository.create).mockResolvedValueOnce(SAVED_ROW);

    const saved = await addBill(PDF_BILL);

    expect(saveUpload).toHaveBeenCalledWith(PDF_BILL, '.pdf');
    expect(billsRepository.create).toHaveBeenCalledWith({
      fileName: FILE_NAME,
      fileType: 'PDF',
      originalName: null,
      sizeBytes: PDF_BILL.length,
    });
    expect(saved).toEqual({
      id: 9,
      name: 'bill.pdf',
      contentType: 'application/pdf',
      sizeBytes: PDF_BILL.length,
      createdAt: '2026-11-03T09:00:00.000Z',
    });
  });

  // What is kept of the name the client sent (percent-encoded): its own name only, cleaned, never a path.
  it.each([
    ['a plain name', 'october.pdf', 'october.pdf'],
    ['letters outside ASCII', 'Fatura de Março ü.pdf', 'Fatura de Março ü.pdf'],
    ['a Unix path', '/home/me/../bills/october.pdf', 'october.pdf'],
    ['a Windows path', 'C:\\Users\\me\\october.pdf', 'october.pdf'],
    ['a right-to-left override that hides the real extension', 'bill\u202Efdp.exe', 'billfdp.exe'],
    ['control characters', 'oct\u0000ober\u0007.pdf', 'october.pdf'],
    ['an invisible character between two spaces', 'my \u200B bill.pdf', 'my bill.pdf'],
    ['tabs, line breaks and runs of spaces', '  my\t\nbill   2026.pdf  ', 'my bill 2026.pdf'],
    ['a name made of dots only', '..', null],
    ['a name made of spaces only', '   ', null],
    ['an empty name', '', null],
  ])('keeps the cleaned name when the client sends %s', async (_scenario, sentName, keptName) => {
    vi.mocked(saveUpload).mockResolvedValueOnce(FILE_NAME);
    vi.mocked(billsRepository.create).mockResolvedValueOnce(SAVED_ROW);

    await addBill(PDF_BILL, encodeURIComponent(sentName));

    expect(billsRepository.create).toHaveBeenCalledWith(expect.objectContaining({ originalName: keptName }));
  });

  it('keeps 200 characters, the extension among them, when the name is longer', async () => {
    vi.mocked(saveUpload).mockResolvedValueOnce(FILE_NAME);
    vi.mocked(billsRepository.create).mockResolvedValueOnce(SAVED_ROW);

    await addBill(PDF_BILL, encodeURIComponent(`${'ü'.repeat(250)}.pdf`));

    expect(billsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ originalName: `${'ü'.repeat(196)}.pdf` }),
    );
  });

  it('removes the file again when its row cannot be saved', async () => {
    const failure = new Error('database down');
    vi.mocked(saveUpload).mockResolvedValueOnce(FILE_NAME);
    vi.mocked(billsRepository.create).mockRejectedValueOnce(failure);

    await expect(addBill(PDF_BILL)).rejects.toBe(failure);

    expect(removeUpload).toHaveBeenCalledWith(FILE_NAME);
  });

  it('throws BILL_NOT_SUPPORTED and keeps nothing when the bytes are no PDF, JPEG or PNG', async () => {
    await expect(addBill(Buffer.from('GIF89a'))).rejects.toMatchObject({ code: 'BILL_NOT_SUPPORTED', statusCode: 400 });

    expect(saveUpload).not.toHaveBeenCalled();
  });
});

describe('getBillFile', () => {
  it('throws NOT_FOUND when the row exists but its file is gone', async () => {
    vi.mocked(billsRepository.findById).mockResolvedValueOnce(SAVED_ROW);
    vi.mocked(openUpload).mockResolvedValueOnce(undefined);

    await expect(getBillFile(9)).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });
});

describe('deleteUnlinkedBills', () => {
  it('removes the bills and their files when no reading took them within a day', async () => {
    vi.mocked(billsRepository.deleteUnlinkedBefore).mockResolvedValueOnce([FILE_NAME]);

    await deleteUnlinkedBills(new Date('2026-11-03T09:00:00.000Z'));

    expect(billsRepository.deleteUnlinkedBefore).toHaveBeenCalledWith(new Date('2026-11-02T09:00:00.000Z'));
    expect(removeUpload).toHaveBeenCalledWith(FILE_NAME);
  });

  it('still finishes when a file cannot be removed', async () => {
    vi.mocked(billsRepository.deleteUnlinkedBefore).mockResolvedValueOnce([FILE_NAME]);
    vi.mocked(removeUpload).mockRejectedValueOnce(new Error('permission denied'));

    await expect(deleteUnlinkedBills()).resolves.toBeUndefined();
  });
});
