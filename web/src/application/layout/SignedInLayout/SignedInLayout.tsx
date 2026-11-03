import { useLoaderData } from 'react-router';
import { MailStateUtil, type LoaderDataUtil } from '@app-types/utility';
import { useIsWideScreen } from '@hooks/useIsWideScreen';
import DesktopShell from './components/DesktopShell';
import PhoneShell from './components/PhoneShell';
import type { loader } from './signedInLayoutLoader';

// The signed-in part of the app: a phone gets the header with its menu, a wider screen the sidebar; both show the
// Hotmail banner while the server cannot send mail. Its loader sends anyone else to setup or the login page.
function SignedInLayout() {
  const { mailStatus } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const isWideScreen = useIsWideScreen();
  const isMailNotConnected = mailStatus.state === MailStateUtil.NOT_CONNECTED;

  if (isWideScreen) return <DesktopShell isMailNotConnected={isMailNotConnected} />;

  return <PhoneShell isMailNotConnected={isMailNotConnected} />;
}

export default SignedInLayout;
