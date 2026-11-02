import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import mailService from '@services/mailService/mailService';
import { AuthStateUtil } from '@app-types/utility';
import { redirectForAuthState, type AuthStateRedirects } from '@utils/authRedirectUtils';

// Where someone who is not signed in goes instead: the setup page before setup, the login page after it.
const NOT_SIGNED_IN_REDIRECTS: AuthStateRedirects = {
  [AuthStateUtil.SETUP]: AUTH_ROUTES_PATHS.SETUP,
  [AuthStateUtil.SIGNED_OUT]: AUTH_ROUTES_PATHS.LOGIN,
};

// Every app page sits below this route: it opens only for a signed-in browser (ADR 0002). Once signed in, it also
// asks whether the server can send mail, for the Hotmail banner every page shows. The mail status needs a session,
// so it is asked after the sign-in check, never beside it.
export async function loader() {
  const redirectResponse = await redirectForAuthState(NOT_SIGNED_IN_REDIRECTS);

  if (redirectResponse) return redirectResponse;

  const mailStatus = await mailService.getStatus();

  return { mailStatus };
}
