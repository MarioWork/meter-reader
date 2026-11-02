import { readingsRepository } from './readings.repository.ts';
import { AppError } from '../../lib/errors.ts';
import { NotFoundError } from '../../lib/httpErrors.ts';
import { readUpload, removeUpload } from '../../lib/uploads.ts';
import { sendMail } from '../mail/mail.service.ts';
import { addReading, deleteReading, getReadings, sendReading } from './readings.service.ts';

vi.mock('./readings.repository.ts', () => ({
  readingsRepository: {
    create: vi.fn(),
    findPage: vi.fn(),
    findById: vi.fn(),
    markSent: vi.fn(),
    markFailed: vi.fn(),
    deleteById: vi.fn(),
  },
}));

vi.mock('../../lib/uploads.ts', () => ({ readUpload: vi.fn(), removeUpload: vi.fn() }));

vi.mock('../mail/mail.service.ts', () => ({ assertMailConnected: vi.fn(), sendMail: vi.fn() }));

const PHOTO = { id: 4, fileName: '5b0f3c1e-6f7a-4d2b-9a51-2c8e0d9b7f10.jpg' };

const SAVED_ROW = {
  id: 7,
  digits: '00123',
  date: new Date('2026-10-31T00:00:00.000Z'),
  status: 'NOT_SENT' as const,
  sentAt: null,
  createdAt: new Date('2026-11-01T08:15:00.000Z'),
  photo: null,
};

describe('addReading', () => {
  it('stores the day as midnight UTC and answers it as a calendar day when the reading is saved', async () => {
    vi.mocked(readingsRepository.create).mockResolvedValueOnce(SAVED_ROW);

    const reading = await addReading({ digits: '00123', date: '2026-10-31' });

    expect(readingsRepository.create).toHaveBeenCalledWith({
      digits: '00123',
      date: new Date('2026-10-31T00:00:00.000Z'),
      photoId: undefined,
    });
    expect(reading).toEqual({
      id: 7,
      digits: '00123',
      date: '2026-10-31',
      status: 'notSent',
      createdAt: '2026-11-01T08:15:00.000Z',
      photoId: null,
      sentAt: null,
    });
  });

  it('passes the photo id on and answers it when the reading has a photo', async () => {
    vi.mocked(readingsRepository.create).mockResolvedValueOnce({ ...SAVED_ROW, photo: PHOTO });

    const reading = await addReading({ digits: '00123', date: '2026-10-31', photoId: 4 });

    expect(readingsRepository.create).toHaveBeenCalledWith(expect.objectContaining({ photoId: 4 }));
    expect(reading.photoId).toBe(4);
  });
});

describe('getReadings', () => {
  it('asks for the rows of the page and answers them with the total when a page is asked', async () => {
    vi.mocked(readingsRepository.findPage).mockResolvedValueOnce({
      rows: [{ ...SAVED_ROW, status: 'FAILED' }],
      total: 21,
    });

    const page = await getReadings({ page: 3, size: 10 });

    expect(readingsRepository.findPage).toHaveBeenCalledWith({ skip: 20, take: 10 });
    expect(page).toMatchObject({ totalResultNumber: 21, currentPage: 3, data: [{ id: 7, status: 'failed' }] });
  });
});

describe('addReading with a photo', () => {
  it('throws PHOTO_NOT_AVAILABLE when the photo is unknown or already taken', async () => {
    vi.mocked(readingsRepository.create).mockResolvedValueOnce(null);

    const adding = addReading({ digits: '00123', date: '2026-10-31', photoId: 4 });

    await expect(adding).rejects.toMatchObject({ code: 'PHOTO_NOT_AVAILABLE', statusCode: 409 });
  });
});

describe('deleteReading', () => {
  it('deletes the reading by its id when the reading exists', async () => {
    vi.mocked(readingsRepository.deleteById).mockResolvedValueOnce(SAVED_ROW);

    await deleteReading(7);

    expect(readingsRepository.deleteById).toHaveBeenCalledWith(7);
    expect(removeUpload).not.toHaveBeenCalled();
  });

  it("removes the photo's file when the deleted reading had a photo", async () => {
    vi.mocked(readingsRepository.deleteById).mockResolvedValueOnce({ ...SAVED_ROW, photo: PHOTO });

    await deleteReading(7);

    expect(removeUpload).toHaveBeenCalledWith(PHOTO.fileName);
  });

  it('still succeeds when the photo file cannot be removed, as the reading is already gone', async () => {
    vi.mocked(readingsRepository.deleteById).mockResolvedValueOnce({ ...SAVED_ROW, photo: PHOTO });
    vi.mocked(removeUpload).mockRejectedValueOnce(Object.assign(new Error('permission denied'), { code: 'EACCES' }));

    await expect(deleteReading(7)).resolves.toBeUndefined();
  });

  it('throws NotFoundError when the reading does not exist', async () => {
    vi.mocked(readingsRepository.deleteById).mockResolvedValueOnce(null);

    const deleting = deleteReading(7);

    await expect(deleting).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleting).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('sendReading', () => {
  it('refuses a second send of the same reading with READING_BEING_SENT while the first is still going', async () => {
    vi.mocked(readingsRepository.findById).mockResolvedValue(SAVED_ROW);
    vi.mocked(readingsRepository.markSent).mockResolvedValue({ ...SAVED_ROW, status: 'SENT', sentAt: new Date() });
    let finishSending = () => {};
    vi.mocked(sendMail).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishSending = resolve;
        }),
    );

    const first = sendReading(7, { attachPhoto: false });
    const second = sendReading(7, { attachPhoto: false });

    await expect(second).rejects.toMatchObject({ code: 'READING_BEING_SENT', statusCode: 409 });
    await vi.waitFor(() => expect(sendMail).toHaveBeenCalled());
    finishSending();
    await expect(first).resolves.toMatchObject({ status: 'sent' });
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it('marks the reading failed with a 409 PHOTO_FILE_MISSING, sending nothing, when the photo file is gone', async () => {
    vi.mocked(readingsRepository.findById).mockResolvedValueOnce({ ...SAVED_ROW, photo: PHOTO });
    vi.mocked(readUpload).mockResolvedValueOnce(undefined);

    const sending = sendReading(7, { attachPhoto: true });

    await expect(sending).rejects.toMatchObject({ code: 'PHOTO_FILE_MISSING', statusCode: 409 });
    expect(sendMail).not.toHaveBeenCalled();
    expect(readingsRepository.markFailed).toHaveBeenCalledWith(7);
  });

  it('answers 413 MAIL_TOO_LARGE and marks the reading failed when the photo is over Microsoft limit', async () => {
    vi.mocked(readingsRepository.findById).mockResolvedValueOnce(SAVED_ROW);
    vi.mocked(sendMail).mockRejectedValueOnce(new AppError('too large', { code: 'MAIL_TOO_LARGE' }));

    const sending = sendReading(7, { attachPhoto: false });

    await expect(sending).rejects.toMatchObject({ code: 'MAIL_TOO_LARGE', statusCode: 413 });
    expect(readingsRepository.markFailed).toHaveBeenCalledWith(7);
  });

  it('marks the reading failed and lets a bug through as it is when sending throws something unexpected', async () => {
    vi.mocked(readingsRepository.findById).mockResolvedValueOnce(SAVED_ROW);
    const bug = new TypeError('cannot read properties of undefined');
    vi.mocked(sendMail).mockRejectedValueOnce(bug);

    await expect(sendReading(7, { attachPhoto: false })).rejects.toBe(bug);
    expect(readingsRepository.markFailed).toHaveBeenCalledWith(7);
  });

  it("still answers Microsoft's reason when saving the failure itself fails", async () => {
    vi.mocked(readingsRepository.findById).mockResolvedValueOnce(SAVED_ROW);
    vi.mocked(sendMail).mockRejectedValueOnce(new AppError('Microsoft is busy', { code: 'MAIL_SERVICE_BUSY' }));
    vi.mocked(readingsRepository.markFailed).mockRejectedValueOnce(new Error('connection terminated'));

    const sending = sendReading(7, { attachPhoto: false });

    await expect(sending).rejects.toMatchObject({ code: 'MAIL_SERVICE_BUSY', statusCode: 502 });
  });
});
