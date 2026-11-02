import type { JSONResponseUtil } from '@app-types/utility';
import { toast } from '@components/ui/toast';

export type ActionToastMessages = {
  success: string;
  failure: string;
};

// Tells the user how a write went once its action has answered, then hands the answer on unchanged. A redirect is a
// success; an envelope with `success: false` is a failure. Called from the action, because a write that redirects
// unmounts the form that sent it. The Toaster in AppProviders shows it in a polite live region.
export function toastActionResult<Result extends JSONResponseUtil | Response>(
  result: Result,
  messages: ActionToastMessages,
): Result {
  const isRedirect = result instanceof Response;
  const hasFailed = !isRedirect && !result.success;

  if (hasFailed) {
    toast.add({ type: 'error', title: messages.failure });

    return result;
  }

  toast.add({ type: 'success', title: messages.success });

  return result;
}
