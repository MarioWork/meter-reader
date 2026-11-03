import Logo from '@components/Logo';
import { cn } from '@utils/classNameUtils';

const APP_NAME = 'Meter Reader';

type Props = {
  // Shows the logo alone (the collapsed sidebar). The name stays for screen readers, so it is still the link's name.
  isNameHidden?: boolean;
};

// The logo and the app name, on every page: in the phone's header, at the top of the sidebar and over the standalone
// pages' card. Not a heading, so each page keeps its own title as its only h1. The logo is decorative next to the name.
function AppBrand({ isNameHidden = false }: Props) {
  return (
    <p className="flex items-center gap-2 text-lg font-semibold">
      <Logo />
      <span className={cn('truncate', isNameHidden && 'sr-only')}>{APP_NAME}</span>
    </p>
  );
}

export default AppBrand;
