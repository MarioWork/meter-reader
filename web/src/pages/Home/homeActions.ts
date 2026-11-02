import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import readingService from '@services/readingService/readingService';
import { ReadingParamsSchema } from '@services/readingService/readingService.type';
import type { JSONResponseUtil } from '@app-types/utility';
import { toastActionResult } from '@utils/toastUtils';

const DELETE_TOAST_MESSAGES = { success: 'Reading deleted', failure: 'Reading not deleted' };

async function deleteReading({ params }: ActionFunctionArgs): Promise<JSONResponseUtil> {
  try {
    const { readingId } = await ReadingParamsSchema.validate(params);

    return await readingService.deleteReading(readingId);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
}

// Deleted, the router runs Home's loader again and the reading leaves the history. A toast says how it went.
export const deleteReadingAction = async (args: ActionFunctionArgs): Promise<JSONResponseUtil> =>
  toastActionResult(await deleteReading(args), DELETE_TOAST_MESSAGES);
