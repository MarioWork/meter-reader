import { Outlet } from 'react-router';
import { SidebarProvider } from '@components/ui/sidebar';
import AppSidebar from '../AppSidebar';
import MailNotConnectedBanner from '../MailNotConnectedBanner';

type Props = {
  isMailNotConnected: boolean;
};

// A wider screen: the sidebar on the left, the page beside it in a column up to 1280 px (max-w-7xl). Each page still
// sets its own narrower width inside that column. The page area is a plain div, not shadcn's SidebarInset: that one
// is a <main>, and every page brings its own.
function DesktopShell({ isMailNotConnected }: Props) {
  return (
    <SidebarProvider className="bg-background text-foreground">
      <AppSidebar />
      <div className="mx-auto w-full max-w-7xl min-w-0 flex-1">
        {isMailNotConnected && <MailNotConnectedBanner />}
        <Outlet />
      </div>
    </SidebarProvider>
  );
}

export default DesktopShell;
