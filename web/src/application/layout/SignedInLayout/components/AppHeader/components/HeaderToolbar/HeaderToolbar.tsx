import { ChartColumnIcon, LogOutIcon, SettingsIcon } from 'lucide-react';
import { Link } from 'react-router';
import { COSTS_ROUTES_PATHS, SETTINGS_ROUTES_PATHS } from '@application/routes/routesUtils';
import { Button, buttonVariants } from '@components/ui/button';
import { useSignOut } from '../../hooks/useSignOut';
import ThemeToggleGroup from './components/ThemeToggleGroup';

const SIGN_OUT_LABEL = 'Sign out';
const SETTINGS_LABEL = 'Settings';
const COSTS_LABEL = 'Costs';

// What the phone's menu holds, laid out in the bar on a wider screen: Costs, Settings, the theme, then Sign out.
function HeaderToolbar() {
  const { signOut } = useSignOut();

  return (
    <div className="flex items-center gap-3">
      <Link to={COSTS_ROUTES_PATHS.BASE} className={buttonVariants({ variant: 'ghost' })}>
        <ChartColumnIcon aria-hidden="true" />
        {COSTS_LABEL}
      </Link>
      <Link to={SETTINGS_ROUTES_PATHS.BASE} className={buttonVariants({ variant: 'ghost' })}>
        <SettingsIcon aria-hidden="true" />
        {SETTINGS_LABEL}
      </Link>
      <ThemeToggleGroup />
      <Button variant="ghost" onClick={signOut}>
        <LogOutIcon aria-hidden="true" />
        {SIGN_OUT_LABEL}
      </Button>
    </div>
  );
}

export default HeaderToolbar;
