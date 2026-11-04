import type { ActionFunctionArgs } from 'react-router';
import type { JSONResponseUtil } from '@app-types/utility';
import { deleteReadingNamedBy, READING_DELETED_MESSAGE } from '@utils/deleteReadingUtils';
import { toastOnSuccess } from '@utils/toastUtils';

// Deleted, the router runs Home's loader again and the reading leaves the history. A toast says it is gone.
export const deleteReadingAction = async ({ params }: ActionFunctionArgs): Promise<JSONResponseUtil> =>
  toastOnSuccess(await deleteReadingNamedBy(params), READING_DELETED_MESSAGE);
