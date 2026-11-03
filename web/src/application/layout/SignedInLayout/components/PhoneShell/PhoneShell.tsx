import { Outlet } from 'react-router';
import AppHeader from '../AppHeader';
import MailNotConnectedBanner from '../MailNotConnectedBanner';

type Props = {
  isMailNotConnected: boolean;
};

// A phone: the sticky header with its menu over the page.
function PhoneShell({ isMailNotConnected }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      {isMailNotConnected && <MailNotConnectedBanner />}
      <Outlet />
    </div>
  );
}

export default PhoneShell;
