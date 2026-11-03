import { LogOutIcon } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '@components/ui/sidebar';
import { useSignOut } from '../../../hooks/useSignOut';
import SidebarItemLabel from './SidebarItemLabel';

const SIGN_OUT_LABEL = 'Sign out';

function SidebarSignOutButton() {
  const { signOut } = useSignOut();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={SIGN_OUT_LABEL} onClick={signOut}>
        <LogOutIcon aria-hidden="true" />
        <SidebarItemLabel label={SIGN_OUT_LABEL} />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default SidebarSignOutButton;
