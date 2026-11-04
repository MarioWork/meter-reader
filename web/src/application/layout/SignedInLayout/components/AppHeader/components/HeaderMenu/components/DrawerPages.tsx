import { Link, matchPath, useLocation } from 'react-router';
import { buttonVariants } from '@components/ui/button';
import { cn } from '@utils/classNameUtils';
import { appPages } from '@utils/appPagesUtils';

type Props = {
  // A tap on a page closes the drawer, so the page shows at once.
  onNavigate: () => void;
};

const NAV_LABEL = 'Pages';

// Home, Costs and Settings, as on the sidebar, with the page the user is on marked: for screen readers (aria-current)
// and filled on screen. Each is a full-width row, well over the 24 px minimum target.
function DrawerPages({ onNavigate }: Props) {
  const { pathname } = useLocation();

  return (
    <nav aria-label={NAV_LABEL} className="flex flex-col gap-1">
      {appPages().map(({ label, to, basePath, Icon }) => {
        const isCurrent = matchPath({ path: basePath, end: false }, pathname) !== null;

        return (
          <Link
            key={basePath}
            to={to}
            aria-current={isCurrent ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'lg' }),
              'h-11 justify-start gap-3 text-base',
              isCurrent && 'bg-accent text-accent-foreground',
            )}
          >
            <Icon aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default DrawerPages;
