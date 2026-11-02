import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import { AuthStateUtil } from '@app-types/utility';
import { redirectForAuthState, type AuthStateRedirects } from '@utils/authRedirectUtils';

// Where someone who is not signed in goes instead: the setup page before setup, the login page after it.
const NOT_SIGNED_IN_REDIRECTS: AuthStateRedirects = {
  [AuthStateUtil.SETUP]: AUTH_ROUTES_PATHS.SETUP,
  [AuthStateUtil.SIGNED_OUT]: AUTH_ROUTES_PATHS.LOGIN,
};

// Every app page sits below this route: it opens only for a signed-in browser (ADR 0002).
export async function loader() {
  return (await redirectForAuthState(NOT_SIGNED_IN_REDIRECTS)) ?? null;
}
