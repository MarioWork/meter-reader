import { redirect } from 'react-router';
import authService from '@services/authService/authService';
import type { AuthStateUtil } from '@app-types/utility';

// Where a page sends the browser for each login state it is not meant for.
export type AuthStateRedirects = Partial<Record<AuthStateUtil, string>>;

// Asks the API where the login stands and answers the redirect for that state, or undefined to stay on the page.
export async function redirectForAuthState(redirects: AuthStateRedirects): Promise<Response | undefined> {
  const { state } = await authService.getStatus();
  const elsewhere = redirects[state];

  if (!elsewhere) return undefined;

  return redirect(elsewhere);
}
