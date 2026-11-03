import type { PDFPageProxy } from 'pdfjs-dist';

// A PDF read by pdf.js: its pages in order, and how to let go of it (and its worker) once nothing shows it.
export type PdfDocument = {
  pages: PDFPageProxy[];
  destroy: () => Promise<void>;
};

// A bill open in the viewer: the PDF read from it, and the file itself, to download as it is.
export type BillDocument = PdfDocument & {
  file: Blob;
};
