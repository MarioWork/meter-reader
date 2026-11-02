import { AUTH_ROUTES_PATHS, defaultRedirectRoute } from '@application/routes/routesUtils';
import { AuthStateUtil } from '@app-types/utility';
import { redirectForAuthState, type AuthStateRedirects } from '@utils/authRedirectUtils';

// The login page is only for a set-up app and a signed-out browser.
const LOGIN_REDIRECTS: AuthStateRedirects = {
  [AuthStateUtil.SETUP]: AUTH_ROUTES_PATHS.SETUP,
  [AuthStateUtil.SIGNED_IN]: defaultRedirectRoute,
};

export async function loader() {
  return (await redirectForAuthState(LOGIN_REDIRECTS)) ?? null;
}
