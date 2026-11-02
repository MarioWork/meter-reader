import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import readingService from '@services/readingService/readingService';
import { DeleteReadingParamsSchema } from '@services/readingService/readingService.type';
import type { JSONResponseUtil } from '@app-types/utility';

// Deleted, the router runs Home's loader again and the reading leaves the history.
export const deleteReadingAction = async ({ params }: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  try {
    const { readingId } = await DeleteReadingParamsSchema.validate(params);

    return await readingService.deleteReading(readingId);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};
