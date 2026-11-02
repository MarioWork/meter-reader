import { redirect } from 'react-router';
import authService from '@services/authService/authService';
import { AUTH_ROUTES_PATHS, defaultRedirectRoute } from '@application/routes/routesUtils';
import { AuthStateUtil } from '@app-types/utility';

// The login page is only for a set-up app and a signed-out browser.
const LOGIN_REDIRECTS: Partial<Record<AuthStateUtil, string>> = {
  [AuthStateUtil.SETUP]: AUTH_ROUTES_PATHS.SETUP,
  [AuthStateUtil.SIGNED_IN]: defaultRedirectRoute,
};

export async function loader() {
  const { state } = await authService.getStatus();
  const elsewhere = LOGIN_REDIRECTS[state];

  if (elsewhere) return redirect(elsewhere);

  return null;
}
