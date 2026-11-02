import { useFetcher } from 'react-router';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import { HttpVerbsUtil } from '@app-types/utility';
import { Button } from '@components/ui/button';

// Ends this browser's session; the logout action then opens the login page.
function SignOutButton() {
  const fetcher = useFetcher();
  const isSigningOut = fetcher.state !== 'idle';

  const signOut = () => void fetcher.submit(null, { method: HttpVerbsUtil.POST, action: AUTH_ROUTES_PATHS.LOGOUT });

  return (
    <Button variant="outline" disabled={isSigningOut} onClick={signOut}>
      Sign out
    </Button>
  );
}

export default SignOutButton;
