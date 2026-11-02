import { redirect } from 'react-router';
import authService from '@services/authService/authService';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import { AuthStateUtil } from '@app-types/utility';

// Where someone who is not signed in goes instead: the setup page before setup, the login page after it.
const NOT_SIGNED_IN_REDIRECTS: Partial<Record<AuthStateUtil, string>> = {
  [AuthStateUtil.SETUP]: AUTH_ROUTES_PATHS.SETUP,
  [AuthStateUtil.SIGNED_OUT]: AUTH_ROUTES_PATHS.LOGIN,
};

// Every app page sits below this route: it opens only for a signed-in browser (ADR 0002).
export async function loader() {
  const { state } = await authService.getStatus();
  const notSignedInPath = NOT_SIGNED_IN_REDIRECTS[state];

  if (notSignedInPath) return redirect(notSignedInPath);

  return null;
}
