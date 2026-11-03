import { MenuIcon } from 'lucide-react';
import { Button } from '@components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import PagesMenuGroup from './components/PagesMenuGroup';
import SignOutMenuGroup from './components/SignOutMenuGroup';
import ThemeMenuGroup from './components/ThemeMenuGroup';
import { useSignOut } from '../../hooks/useSignOut';

// The header's one menu: Settings, the theme and Sign out. The trigger is 36 px square, over the 24 px minimum target.
function HeaderMenu() {
  const { signOut } = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-lg" aria-label="Menu" />}>
        <MenuIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <PagesMenuGroup />
        <DropdownMenuSeparator />
        <ThemeMenuGroup />
        <DropdownMenuSeparator />
        <SignOutMenuGroup onSignOut={signOut} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default HeaderMenu;
