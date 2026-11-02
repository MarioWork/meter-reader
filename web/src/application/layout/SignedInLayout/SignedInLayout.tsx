import { Outlet, useLoaderData } from 'react-router';
import { MailStateUtil, type LoaderDataUtil } from '@app-types/utility';
import AppHeader from './components/AppHeader';
import MailNotConnectedBanner from './components/MailNotConnectedBanner';
import type { loader } from './signedInLayoutLoader';

// The signed-in part of the app: the header with its menu (theme, sign out) on every page, and the Hotmail banner
// while the server cannot send mail. Its loader sends anyone else to setup or the login page.
function SignedInLayout() {
  const { mailStatus } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const isMailNotConnected = mailStatus.state === MailStateUtil.NOT_CONNECTED;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      {isMailNotConnected && (
        <div className="mx-auto max-w-2xl px-4 pt-4 sm:px-6">
          <MailNotConnectedBanner />
        </div>
      )}
      <Outlet />
    </div>
  );
}

export default SignedInLayout;
