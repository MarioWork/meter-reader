export type BillErrorMockModel = { code: string; message: string };

// The API's error envelope for a file that is no PDF, JPEG or PNG.
export const createBillNotSupportedMockModel = (): BillErrorMockModel => ({
  code: 'BILL_NOT_SUPPORTED',
  message: 'The bill must be a PDF, JPEG or PNG',
});

// The API's error envelope for a file over 10 MB.
export const createBillTooLargeMockModel = (): BillErrorMockModel => ({
  code: 'BILL_TOO_LARGE',
  message: 'The bill must be at most 10 MB',
});
