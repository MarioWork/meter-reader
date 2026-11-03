// What other modules need to know about a bill. The readings answer their bill with one of these content types.

// The types a bill may be, as they travel: the server reads the real one from the file's first bytes.
export const BILL_CONTENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export type BillContentType = (typeof BILL_CONTENT_TYPES)[number];
