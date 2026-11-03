import { SunMoonIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@components/ui/dropdown-menu';
import { SidebarMenuButton, SidebarMenuItem } from '@components/ui/sidebar';
import ThemeMenuGroup from '../../ThemeMenuGroup';
import SidebarItemLabel from './SidebarItemLabel';

const THEME_LABEL = 'Theme';

// A Theme button that opens the same Light / Dark / System choice as the phone's menu, beside the sidebar.
function SidebarThemeMenu() {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <SidebarMenuButton tooltip={THEME_LABEL} render={<DropdownMenuTrigger />}>
          <SunMoonIcon aria-hidden="true" />
          <SidebarItemLabel label={THEME_LABEL} />
        </SidebarMenuButton>
        <DropdownMenuContent side="right" align="end" className="w-44">
          <ThemeMenuGroup />
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

export default SidebarThemeMenu;
