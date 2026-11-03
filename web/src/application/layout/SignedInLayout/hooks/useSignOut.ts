import { useFetcher } from 'react-router';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import { HttpVerbsUtil } from '@app-types/utility';

// Ends this browser's session; the logout action then opens the login page. On a phone the fetcher lives with the
// menu, not the menu item, because the item unmounts as soon as the menu closes; the sidebar's Sign out button never
// unmounts, so it calls this itself.
export function useSignOut() {
  const fetcher = useFetcher();

  function signOut() {
    void fetcher.submit(null, { method: HttpVerbsUtil.POST, action: AUTH_ROUTES_PATHS.LOGOUT });
  }

  return { signOut };
}
