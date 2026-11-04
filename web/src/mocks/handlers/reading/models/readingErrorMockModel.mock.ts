import type { ReadingId } from '@app-types/models';

export type ReadingErrorMockModel = { code: string; message: string };

// The API's error envelope when the reading a request names is not there (already deleted).
export const createReadingNotFoundMockModel = (id: ReadingId): ReadingErrorMockModel => ({
  code: 'NOT_FOUND',
  message: `Reading ${id} not found`,
});

// The API's error envelope when a request's query fails its checks (a day range that ends before it starts).
export const createReadingValidationErrorMockModel = (): ReadingErrorMockModel => ({
  code: 'VALIDATION_ERROR',
  message: 'Request validation failed',
});

// The API's error envelope when a reading is updated with a bill that is not there, or belongs to another reading.
export const createBillNotAvailableMockModel = (): ReadingErrorMockModel => ({
  code: 'BILL_NOT_AVAILABLE',
  message: 'This bill does not exist or already belongs to another reading',
});

// The API's error envelope when a photo is added to a reading that has one, or the photo belongs to another reading.
export const createPhotoNotAvailableMockModel = (): ReadingErrorMockModel => ({
  code: 'PHOTO_NOT_AVAILABLE',
  message: 'This reading already has a photo, or that photo belongs to another reading',
});
