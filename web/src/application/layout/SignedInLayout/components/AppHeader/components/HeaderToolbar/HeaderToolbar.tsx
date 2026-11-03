import { LogOutIcon } from 'lucide-react';
import { Button } from '@components/ui/button';
import { useSignOut } from '../../hooks/useSignOut';
import ThemeToggleGroup from './components/ThemeToggleGroup';

const SIGN_OUT_LABEL = 'Sign out';

// What the phone's menu holds, laid out in the bar on a wider screen: the theme, then Sign out.
function HeaderToolbar() {
  const { signOut } = useSignOut();

  return (
    <div className="flex items-center gap-3">
      <ThemeToggleGroup />
      <Button variant="ghost" onClick={signOut}>
        <LogOutIcon aria-hidden="true" />
        {SIGN_OUT_LABEL}
      </Button>
    </div>
  );
}

export default HeaderToolbar;
