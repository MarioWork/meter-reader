import { redirect, type ActionFunctionArgs } from 'react-router';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { JSONResponseUtil } from '@app-types/utility';
import { deleteReadingNamedBy, READING_DELETED_MESSAGE } from '@utils/deleteReadingUtils';
import { toastOnSuccess } from '@utils/toastUtils';
import { withSearchOf } from '@utils/urlSearchUtils';

async function deleteReading({ params, request }: ActionFunctionArgs): Promise<JSONResponseUtil | Response> {
  const result = await deleteReadingNamedBy(params);

  if (!result.success) return result;

  return redirect(withSearchOf(request.url, BASE_ROUTES_PATHS.HOME));
}

// Deleted from its own page, the reading is gone, so the page goes back to Home, with its filters and pages, and a
// toast says so. Not deleted, the confirm dialog stays open with the reason.
export const deleteReadingAction = async (args: ActionFunctionArgs): Promise<JSONResponseUtil | Response> =>
  toastOnSuccess(await deleteReading(args), READING_DELETED_MESSAGE);
