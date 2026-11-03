import { Sidebar, SidebarContent, SidebarHeader } from '@components/ui/sidebar';
import SidebarActions from './components/SidebarActions';
import SidebarBrand from './components/SidebarBrand';
import SidebarEdgeToggle from './components/SidebarEdgeToggle';
import SidebarPages from './components/SidebarPages';

const SIDEBAR_LABEL = 'Main';

// A wider screen's navigation, in place of the phone's header: the app name (a link Home), the pages, then the theme
// and Sign out at the bottom. It collapses to icons from its edge (SidebarEdgeToggle) or with Ctrl/⌘ B, and never
// hides. The whole column is one named navigation landmark.
function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <nav aria-label={SIDEBAR_LABEL} className="flex min-h-0 flex-1 flex-col">
        <SidebarHeader className="p-3 group-data-[collapsible=icon]:items-center">
          <SidebarBrand />
        </SidebarHeader>
        <SidebarContent>
          <SidebarPages />
        </SidebarContent>
        <SidebarActions />
      </nav>
      <SidebarEdgeToggle />
    </Sidebar>
  );
}

export default AppSidebar;
