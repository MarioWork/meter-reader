import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import readingService from '@services/readingService/readingService';
import { ReadingParamsSchema } from '@services/readingService/readingService.type';
import type { JSONResponseUtil } from '@app-types/utility';
import { toastOnSuccess } from '@utils/toastUtils';

const DELETED_MESSAGE = 'Reading deleted';

async function deleteReading({ params }: ActionFunctionArgs): Promise<JSONResponseUtil> {
  try {
    const { readingId } = await ReadingParamsSchema.validate(params);

    return await readingService.deleteReading(readingId);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
}

// Deleted, the router runs Home's loader again and the reading leaves the history. A toast says it is gone.
export const deleteReadingAction = async (args: ActionFunctionArgs): Promise<JSONResponseUtil> =>
  toastOnSuccess(await deleteReading(args), DELETED_MESSAGE);
