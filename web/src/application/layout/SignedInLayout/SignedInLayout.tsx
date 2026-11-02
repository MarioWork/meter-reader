import { Outlet, useLoaderData } from 'react-router';
import { MailStateUtil, type LoaderDataUtil } from '@app-types/utility';
import MailNotConnectedBanner from './components/MailNotConnectedBanner';
import SignOutButton from './components/SignOutButton';
import type { loader } from './signedInLayoutLoader';

// The signed-in part of the app: the header with sign-out on every page, and the Hotmail banner while the server
// cannot send mail. Its loader sends anyone else to setup or the login page.
function SignedInLayout() {
  const { mailStatus } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const isMailNotConnected = mailStatus.state === MailStateUtil.NOT_CONNECTED;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <span className="text-lg font-semibold">Meter Reader</span>
        <SignOutButton />
      </header>
      {isMailNotConnected && <MailNotConnectedBanner />}
      <Outlet />
    </div>
  );
}

export default SignedInLayout;
