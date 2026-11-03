import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfDocument } from './types';

// Served by the app itself (pdfjsAssetsPlugin.ts in the web root) and precached by the service worker, so a bill opens
// offline and under the app's CSP. Never a CDN.
const PDFJS_ASSETS_PATH = `${import.meta.env.BASE_URL}pdfjs/`;
const WORKER_FILE = 'pdf.worker.min.js';
// The image decoders, and the two standard fonts the browser has no system font for.
const WASM_FOLDER = 'wasm/';
const STANDARD_FONTS_FOLDER = 'standard_fonts/';
const FIRST_PAGE_NUMBER = 1;

// Every page of the PDF, read once, so the viewer lays them all out at once.
async function readPages(pdf: PDFDocumentProxy): Promise<PdfDocument['pages']> {
  const pageNumbers = Array.from({ length: pdf.numPages }, (_, index) => index + FIRST_PAGE_NUMBER);

  return Promise.all(pageNumbers.map((pageNumber) => pdf.getPage(pageNumber)));
}

// Reads a PDF with pdf.js. Loaded on the first bill opened only: pdf.js stays out of the main bundle.
export async function openPdfDocument(file: Blob): Promise<PdfDocument> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');

  GlobalWorkerOptions.workerSrc = `${PDFJS_ASSETS_PATH}${WORKER_FILE}`;

  // A copy: pdf.js hands its bytes over to its worker, and the file stays whole for Download.
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({
    data,
    wasmUrl: `${PDFJS_ASSETS_PATH}${WASM_FOLDER}`,
    standardFontDataUrl: `${PDFJS_ASSETS_PATH}${STANDARD_FONTS_FOLDER}`,
  });

  // Destroying the loading task ends the document and its worker, also when the file turns out to be no PDF.
  try {
    const pages = await readPages(await loadingTask.promise);

    return { pages, destroy: () => loadingTask.destroy() };
  } catch (error) {
    await loadingTask.destroy();

    throw error;
  }
}
