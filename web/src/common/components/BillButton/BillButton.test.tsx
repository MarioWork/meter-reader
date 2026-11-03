import { http, HttpResponse } from 'msw/http';
import type { PDFPageProxy } from 'pdfjs-dist';
import { billRoutes } from '@application/routes/featureRoutes/billRoutes';
import type { ReadingBillApiModel } from '@app-types/models';
import { Dialog, DialogContent, DialogTitle } from '@components/ui/dialog';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { act, deferred, renderRoutes, screen, userEvent, waitFor, within } from '@test-utils';
import BillButton from './BillButton';
import { openPdfDocument } from './pdfDocumentUtils';
import type { PdfDocument } from './types';

// pdf.js needs a real browser (a canvas, a worker); the pages it reads from the file are faked here.
vi.mock('./pdfDocumentUtils', () => ({ openPdfDocument: vi.fn() }));

const BILL_NAME = 'Fatura de Outubro.pdf';
const BILL: ReadingBillApiModel = { id: 7, name: BILL_NAME, contentType: 'application/pdf', sizeBytes: 184_320 };
const BUTTON_NAME = `${BILL_NAME}, opens the bill`;
const PDF_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d];
const OBJECT_URL = 'blob:http://localhost:3000/5f0c8a2e-3b7d-4c1e-9a6f-2d8b4e7c1a90';
const OUTER_DIALOG_TITLE = 'Reading of 1 Oct 2026';
// An A4 page, in PDF points.
const A4_WIDTH = 595;
const A4_HEIGHT = 842;

function fakePage(pageNumber: number): PDFPageProxy {
  return {
    pageNumber,
    getViewport: ({ scale }: { scale: number }) => ({ width: A4_WIDTH * scale, height: A4_HEIGHT * scale }),
    render: () => ({ promise: Promise.resolve(), cancel: () => {} }),
  } as unknown as PDFPageProxy;
}

const TWO_PAGE_PDF: PdfDocument = { pages: [fakePage(1), fakePage(2)], destroy: vi.fn() };

const createObjectUrl = vi.fn((_file: Blob) => OBJECT_URL);

function answerBill(response: () => Response) {
  server.use(http.get(`${TEST_BASE_API_URL}/bills/${BILL.id}`, response));
}

function answerPdf() {
  return new HttpResponse(new Uint8Array(PDF_BYTES), { headers: { 'Content-Type': 'application/pdf' } });
}

function renderBillButton(element = <BillButton bill={BILL} />) {
  return renderRoutes([{ path: '/', element }, ...billRoutes]);
}

// The bill's button inside another modal dialog, as in a reading's details. `onOpenChange` hears it trying to close.
function renderInsideDialog(onOpenChange: (isOpening: boolean) => void) {
  return renderBillButton(
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{OUTER_DIALOG_TITLE}</DialogTitle>
        <BillButton bill={BILL} />
      </DialogContent>
    </Dialog>,
  );
}

function billButton() {
  return screen.getByRole('button', { name: BUTTON_NAME });
}

async function openViewer() {
  await userEvent.click(billButton());

  const viewer = screen.getByRole('dialog', { name: BILL_NAME });
  await within(viewer).findByText('2 pages');

  return viewer;
}

// Every download link the app clicks, by the name it saves under.
function recordDownloads() {
  const downloads: { fileName: string; href: string }[] = [];

  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function recordDownload(this: HTMLAnchorElement) {
    downloads.push({ fileName: this.download, href: this.href });
  });

  return downloads;
}

beforeEach(() => {
  answerBill(answerPdf);
  vi.mocked(openPdfDocument).mockResolvedValue(TWO_PAGE_PDF);
  // jsdom has no object URLs.
  URL.createObjectURL = createObjectUrl;
  URL.revokeObjectURL = vi.fn();
});

it('opens the bill in a full-screen viewer, named after its file, with every page and the page count', async () => {
  const downloads = recordDownloads();
  const pdf = deferred<PdfDocument>();
  vi.mocked(openPdfDocument).mockReturnValueOnce(pdf.promise);
  renderBillButton();

  expect(billButton()).toHaveAttribute('aria-haspopup', 'dialog');
  await userEvent.click(billButton());

  const viewer = screen.getByRole('dialog', { name: BILL_NAME });
  expect(within(viewer).getByRole('status')).toHaveTextContent('Opening the bill…');
  pdf.resolve(TWO_PAGE_PDF);
  expect(await within(viewer).findByText('2 pages')).toBeVisible();
  expect(within(viewer).getAllByRole('img', { name: /^Page \d of 2$/ })).toHaveLength(2);
  expect(within(viewer).getByRole('img', { name: 'Page 1 of 2' })).toBeVisible();
  expect(within(viewer).queryByRole('status')).not.toBeInTheDocument();
  expect(downloads).toEqual([]);
});

it('reads the file the API sends for the bill', async () => {
  renderBillButton();

  await openViewer();

  const file = vi.mocked(openPdfDocument).mock.calls[0]?.[0];
  expect(file).toBeInstanceOf(Blob);
  expect(file?.type).toBe('application/pdf');
});

it('closes with the × and gives focus back to the bill', async () => {
  renderBillButton();
  const viewer = await openViewer();

  await userEvent.click(within(viewer).getByRole('button', { name: 'Close' }));

  expect(screen.queryByRole('dialog', { name: BILL_NAME })).not.toBeInTheDocument();
  expect(billButton()).toHaveFocus();
});

it('closes with Escape, and only the viewer, when it opened over another dialog', async () => {
  const onOuterOpenChange = vi.fn();
  renderInsideDialog(onOuterOpenChange);
  const viewer = await openViewer();
  await userEvent.click(within(viewer).getByRole('button', { name: 'Zoom in' }));

  await userEvent.keyboard('{Escape}');

  expect(screen.queryByRole('dialog', { name: BILL_NAME })).not.toBeInTheDocument();
  expect(screen.getByRole('dialog', { name: OUTER_DIALOG_TITLE })).toBeVisible();
  expect(onOuterOpenChange).not.toHaveBeenCalled();
  expect(billButton()).toHaveFocus();
});

it("closes when the browser closes it itself, as on the phone's Back button, and gives focus back", async () => {
  renderBillButton();
  await openViewer();
  const viewer = screen.getByRole<HTMLDialogElement>('dialog', { name: BILL_NAME });

  // What the browser does on Back: close the modal dialog. The user cannot press Back in jsdom.
  act(() => {
    viewer.close();
  });

  expect(screen.queryByRole('dialog', { name: BILL_NAME })).not.toBeInTheDocument();
  expect(billButton()).toHaveFocus();
  await userEvent.click(billButton());
  expect(await screen.findByRole('dialog', { name: BILL_NAME })).toBeVisible();
});

it('saves the file under its own name only from Download', async () => {
  const downloads = recordDownloads();
  renderBillButton();
  const viewer = await openViewer();
  expect(downloads).toEqual([]);

  await userEvent.click(within(viewer).getByRole('button', { name: 'Download' }));

  expect(downloads).toEqual([{ fileName: BILL_NAME, href: OBJECT_URL }]);
  const [savedFile] = createObjectUrl.mock.calls[0];
  expect([...new Uint8Array(await savedFile.arrayBuffer())]).toEqual(PDF_BYTES);
});

it('says when the bill cannot be opened, and opens it with Try again', async () => {
  server.use(
    http.get(
      `${TEST_BASE_API_URL}/bills/${BILL.id}`,
      () => HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'Something went wrong' }, { status: 500 }),
      { once: true },
    ),
  );
  renderBillButton();

  await userEvent.click(billButton());

  const viewer = screen.getByRole('dialog', { name: BILL_NAME });
  expect(await within(viewer).findByRole('alert')).toHaveTextContent("The bill couldn't be opened.");
  expect(within(viewer).queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
  await userEvent.click(within(viewer).getByRole('button', { name: 'Try again' }));
  expect(await within(viewer).findByText('2 pages')).toBeVisible();
  expect(within(viewer).queryByRole('alert')).not.toBeInTheDocument();
});

it('zooms in and out with its buttons, down to half the screen width', async () => {
  renderBillButton();
  const viewer = await openViewer();
  const zoomOut = within(viewer).getByRole('button', { name: 'Zoom out' });
  expect(within(viewer).getByText('100%')).toBeVisible();

  await userEvent.click(within(viewer).getByRole('button', { name: 'Zoom in' }));
  expect(within(viewer).getByText('125%')).toBeVisible();
  await userEvent.click(zoomOut);
  await userEvent.click(zoomOut);
  await userEvent.click(zoomOut);

  expect(within(viewer).getByText('50%')).toBeVisible();
  expect(zoomOut).toBeDisabled();
});

it('opens each time at the screen width, with the bill fetched afresh', async () => {
  renderBillButton();
  let viewer = await openViewer();
  await userEvent.click(within(viewer).getByRole('button', { name: 'Zoom in' }));
  await userEvent.click(within(viewer).getByRole('button', { name: 'Close' }));

  viewer = await openViewer();

  expect(within(viewer).getByText('100%')).toBeVisible();
  await waitFor(() => expect(openPdfDocument).toHaveBeenCalledTimes(2));
});
