import type { ReadingId } from '@app-types/models';

type ReadingErrorMockModel = { code: string; message: string };

// The API's error envelope when the reading a request names is not there (already deleted).
// The API's error envelope when the reading's email went out already.
export const createReadingAlreadySentMockModel = (): ReadingErrorMockModel => ({
  code: 'READING_ALREADY_SENT',
  message: 'This reading was sent already',
});

export const createReadingNotFoundMockModel = (id: ReadingId): ReadingErrorMockModel => ({
  code: 'NOT_FOUND',
  message: `Reading ${id} not found`,
});
