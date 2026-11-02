import type { JSONResponseUtil } from '@app-types/utility';
import { toast } from '@components/ui/toast';

// Says a write went through once its action has answered, then hands the answer on unchanged. A redirect is a
// success; an envelope with `success: false` is a failure, which its form already shows next to it, so it gets no
// toast. Called from the action, because a write that redirects unmounts the form that sent it. The Toaster in
// AppProviders shows it in a polite live region.
export function toastOnSuccess<Result extends JSONResponseUtil | Response>(result: Result, message: string): Result {
  const isRedirect = result instanceof Response;
  const hasFailed = !isRedirect && !result.success;

  if (hasFailed) return result;

  toast.add({ type: 'success', title: message });

  return result;
}
