import { SidebarFooter, SidebarMenu } from '@components/ui/sidebar';
import SidebarSignOutButton from './SidebarSignOutButton';
import SidebarThemeMenu from './SidebarThemeMenu';

// At the bottom of the sidebar, in one row: Sign out, then the theme's icon button at the end. Collapsed to icons,
// the theme button sits under Sign out.
function SidebarActions() {
  return (
    <SidebarFooter className="flex-row items-center group-data-[collapsible=icon]:flex-col">
      <SidebarMenu className="min-w-0 flex-1 group-data-[collapsible=icon]:items-center">
        <SidebarSignOutButton />
      </SidebarMenu>
      <SidebarThemeMenu />
    </SidebarFooter>
  );
}

export default SidebarActions;
