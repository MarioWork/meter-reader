import type { ApiError } from '@app-types/models';

// The API's error envelope when the reading a request names is not there (already deleted).
export const createNotFoundMockModel = (id: number): Required<Pick<ApiError, 'code' | 'message'>> => ({
  code: 'NOT_FOUND',
  message: `Reading ${id} not found`,
});
