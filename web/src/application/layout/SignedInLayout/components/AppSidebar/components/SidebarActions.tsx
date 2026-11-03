import { SidebarFooter, SidebarMenu } from '@components/ui/sidebar';
import SidebarSignOutButton from './SidebarSignOutButton';
import SidebarThemeMenu from './SidebarThemeMenu';

// At the bottom of the sidebar: the theme, then Sign out.
function SidebarActions() {
  return (
    <SidebarFooter>
      <SidebarMenu className="group-data-[collapsible=icon]:items-center">
        <SidebarThemeMenu />
        <SidebarSignOutButton />
      </SidebarMenu>
    </SidebarFooter>
  );
}

export default SidebarActions;
