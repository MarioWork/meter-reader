import { MoonIcon, SunIcon } from 'lucide-react';
import { Button } from '@components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@components/ui/dropdown-menu';
import ThemeMenuGroup from '../../ThemeMenuGroup';

const THEME_LABEL = 'Theme';

// An icon button at the end of the sidebar's bottom row: a sun in light mode, a moon in dark. It opens the same Light /
// Dark / System choice as the phone's menu, beside the sidebar.
function SidebarThemeMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={THEME_LABEL} />}>
        <SunIcon className="dark:hidden" aria-hidden="true" />
        <MoonIcon className="hidden dark:block" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-44">
        <ThemeMenuGroup />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default SidebarThemeMenu;
