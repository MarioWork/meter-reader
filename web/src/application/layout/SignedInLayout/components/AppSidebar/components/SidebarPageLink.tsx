import { Link } from 'react-router';
import { SidebarMenuButton, SidebarMenuItem } from '@components/ui/sidebar';
import type { AppPageUtil } from '@app-types/utility';
import SidebarItemLabel from './SidebarItemLabel';

type Props = {
  page: AppPageUtil;
  isCurrent: boolean;
};

// One page in the sidebar. The current one is marked for screen readers (aria-current) and drawn filled. Collapsed to
// icons, the label stays as the link's name and shows as a tooltip.
function SidebarPageLink({ page: { label, to, Icon }, isCurrent }: Props) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isCurrent}
        tooltip={label}
        render={<Link to={to} aria-current={isCurrent ? 'page' : undefined} />}
      >
        <Icon aria-hidden="true" />
        <SidebarItemLabel label={label} />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default SidebarPageLink;
