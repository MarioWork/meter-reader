import { Link } from 'react-router';
import AppBrand from '@components/AppBrand';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { useSidebar } from '@components/ui/sidebar';

// The logo and the app name at the top, a link Home. Collapsed to icons, only the logo shows; the name stays the
// link's name for screen readers.
function SidebarBrand() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Link
      to={BASE_ROUTES_PATHS.HOME}
      className="min-w-0 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <AppBrand isNameHidden={isCollapsed} />
    </Link>
  );
}

export default SidebarBrand;
