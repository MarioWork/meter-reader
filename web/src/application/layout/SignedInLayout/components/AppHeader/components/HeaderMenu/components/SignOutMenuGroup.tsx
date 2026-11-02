import { LogOutIcon } from 'lucide-react';
import { DropdownMenuGroup, DropdownMenuItem } from '@components/ui/dropdown-menu';

type Props = {
  onSignOut: () => void;
};

// Clicking an item closes the menu, so there is no "signing out" state to show here.
function SignOutMenuGroup({ onSignOut }: Props) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuItem onClick={onSignOut}>
        <LogOutIcon />
        Sign out
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}

export default SignOutMenuGroup;
