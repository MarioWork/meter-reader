// What other modules need to know about a bill. The readings answer their bill with one of these content types.

// The types a kept bill may be, as they travel. A new bill is always a PDF (the server reads that from the file's
// first bytes); a JPEG or PNG is one kept before bills were PDF only.
export const BILL_CONTENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export type BillContentType = (typeof BILL_CONTENT_TYPES)[number];

// The one type a new bill may be.
export const BILL_UPLOAD_CONTENT_TYPE = 'application/pdf' satisfies BillContentType;
