import { Link } from 'react-router';
import AppBrand from '@components/AppBrand';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { useIsWideScreen } from '@hooks/useIsWideScreen';
import HeaderMenu from './components/HeaderMenu';
import HeaderToolbar from './components/HeaderToolbar';

// Sticky, so the menu is always one tap away. Its height is fixed (h-14) because index.css keeps that much
// scroll padding at the top of the page, so a focused element never ends up hidden under it (WCAG 2.4.11). A phone
// tucks the theme and Sign out into a menu; a wider screen has room to show them in the bar.
function AppHeader() {
  const isWideScreen = useIsWideScreen();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-card px-4 sm:px-6">
      {/* The brand doubles as the way back Home, as on most sites. Its text is the link's name. */}
      <Link
        to={BASE_ROUTES_PATHS.HOME}
        className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <AppBrand />
      </Link>
      {isWideScreen ? <HeaderToolbar /> : <HeaderMenu />}
    </header>
  );
}

export default AppHeader;
