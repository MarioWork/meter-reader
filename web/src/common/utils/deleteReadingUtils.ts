import type { Params } from 'react-router';
import { ValidationError } from 'yup';
import readingService from '@services/readingService/readingService';
import { ReadingParamsSchema } from '@services/readingService/readingService.type';
import type { JSONResponseUtil } from '@app-types/utility';

// The toast once a reading is gone, from Home's history or from its own page.
export const READING_DELETED_MESSAGE = 'Reading deleted';

// Deletes the reading the route's params name. Params that name none are a failure, never a request.
export async function deleteReadingNamedBy(params: Params): Promise<JSONResponseUtil> {
  try {
    const { readingId } = await ReadingParamsSchema.validate(params);

    return await readingService.deleteReading(readingId);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
}
