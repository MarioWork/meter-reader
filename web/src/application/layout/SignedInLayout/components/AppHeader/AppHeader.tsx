import AppBrand from '@components/AppBrand';
import HeaderMenu from './components/HeaderMenu';

// Sticky, so the menu is always one tap away. Its height is fixed (h-14) because index.css keeps that much
// scroll padding at the top of the page, so a focused element never ends up hidden under it (WCAG 2.4.11).
function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-border bg-card px-4 sm:px-6">
      <AppBrand />
      <HeaderMenu />
    </header>
  );
}

export default AppHeader;
