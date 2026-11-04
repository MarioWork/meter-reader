import { matchPath, useLocation } from 'react-router';
import { SidebarGroup, SidebarMenu } from '@components/ui/sidebar';
import { appPages } from '@utils/appPagesUtils';
import SidebarPageLink from './SidebarPageLink';

// Home, Costs and Settings, with the page the user is on marked.
function SidebarPages() {
  const { pathname } = useLocation();

  return (
    <SidebarGroup>
      <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
        {appPages().map((page) => {
          const isCurrent = matchPath({ path: page.basePath, end: false }, pathname) !== null;

          return <SidebarPageLink key={page.basePath} page={page} isCurrent={isCurrent} />;
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export default SidebarPages;
