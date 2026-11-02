import type { LoaderFunctionArgs } from 'react-router';
import { AUTH_ROUTES_PATHS, AUTH_SEARCH_PARAMS, defaultRedirectRoute } from '@application/routes/routesUtils';
import { AuthStateUtil } from '@app-types/utility';
import { redirectForAuthState, type AuthStateRedirects } from '@utils/authRedirectUtils';

// The setup page is only for an app nobody has set up yet.
const SETUP_REDIRECTS: AuthStateRedirects = {
  [AuthStateUtil.SIGNED_OUT]: AUTH_ROUTES_PATHS.LOGIN,
  [AuthStateUtil.SIGNED_IN]: defaultRedirectRoute,
};

// The one-time code comes from the setup link the server printed (/setup?code=...).
export async function loader({ request }: LoaderFunctionArgs) {
  const elsewhere = await redirectForAuthState(SETUP_REDIRECTS);

  if (elsewhere) return elsewhere;

  const code = new URL(request.url).searchParams.get(AUTH_SEARCH_PARAMS.SETUP_CODE);

  return { code };
}
