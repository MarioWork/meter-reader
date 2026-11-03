// @vitest-environment node
// A loader needs no DOM. (Its vi.mock puts it in the jsdom project, whose Blob the mock network cannot send.)
import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw/http';
import type { LoaderFunctionArgs } from 'react-router';
import { addMockBill } from '@mocks/handlers/bill/billMockState';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { loader } from './billViewerLoader';
import { openPdfDocument } from './pdfDocumentUtils';
import type { PdfDocument } from './types';

// pdf.js needs a browser (a canvas, a worker); what it reads from the file is faked here.
vi.mock('./pdfDocumentUtils', () => ({ openPdfDocument: vi.fn() }));

const PDF = 'application/pdf';
const PDF_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d];
const BILL_NAME = 'Fatura de Outubro.pdf';
const UNAUTHORIZED = 401;

const READ_PDF: PdfDocument = { pages: [], destroy: vi.fn() };

function loadBill(billId: number) {
  const args = { params: { billId: String(billId) } } as unknown as LoaderFunctionArgs;

  return loader(args);
}

beforeEach(() => {
  vi.mocked(openPdfDocument).mockResolvedValue(READ_PDF);
});

it('reads the saved bill, and keeps its file to download', async () => {
  const { id } = addMockBill(new Blob([new Uint8Array(PDF_BYTES)], { type: PDF }), PDF, BILL_NAME);

  const { billDocument } = await loadBill(id);

  expect(billDocument).toMatchObject({ pages: READ_PDF.pages, destroy: READ_PDF.destroy });
  expect([...new Uint8Array(await billDocument!.file.arrayBuffer())]).toEqual(PDF_BYTES);
  expect(vi.mocked(openPdfDocument).mock.calls[0]?.[0]).toBe(billDocument!.file);
});

it('has no bill to show when the API has none by that id', async () => {
  const { billDocument } = await loadBill(99);

  expect(billDocument).toBeNull();
});

it('has no bill to show when the file is no PDF pdf.js can read', async () => {
  const { id } = addMockBill(new Blob(['GIF89a']), PDF, BILL_NAME);
  vi.mocked(openPdfDocument).mockRejectedValue(new Error('Invalid PDF structure.'));

  const { billDocument } = await loadBill(id);

  expect(billDocument).toBeNull();
});

it('still fails on a lost session, so the app sends the browser to the login page', async () => {
  server.use(
    http.get(`${TEST_BASE_API_URL}/bills/:id`, () =>
      HttpResponse.json({ code: 'UNAUTHORIZED', message: 'Sign in again' }, { status: UNAUTHORIZED }),
    ),
  );

  await expect(loadBill(1)).rejects.toBeInstanceOf(AxiosError);
});
