import { LogOutIcon, MenuIcon } from 'lucide-react';
import { useState } from 'react';
import AppBrand from '@components/AppBrand';
import { Button } from '@components/ui/button';
import { Separator } from '@components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@components/ui/sheet';
import DrawerPages from './components/DrawerPages';
import DrawerTheme from './components/DrawerTheme';
import { useSignOut } from '../../../../hooks/useSignOut';

const MENU_LABEL = 'Menu';
const SIGN_OUT_LABEL = 'Sign out';

// The phone's menu, as a drawer from the right: the pages, the theme, and Sign out at the bottom, like the sidebar a
// wider screen has. A modal dialog: focus stays inside while it is open, and Escape, a tap outside or its close button
// shuts it, focus going back to the menu button. The trigger is 36 px square, over the 24 px minimum target. The
// fetcher behind Sign out lives here, not in the drawer, as the drawer unmounts when it closes.
function HeaderMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useSignOut();

  const close = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon-lg" aria-label={MENU_LABEL} />}>
        <MenuIcon aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="right" className="flex w-72 flex-col gap-6 p-4">
        <SheetHeader className="p-0 pr-10">
          <SheetTitle className="sr-only">{MENU_LABEL}</SheetTitle>
          <AppBrand />
        </SheetHeader>
        <DrawerPages onNavigate={close} />
        <Separator />
        <DrawerTheme />
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={signOut}
          className="mt-auto h-11 justify-start gap-3 text-base"
        >
          <LogOutIcon aria-hidden="true" />
          {SIGN_OUT_LABEL}
        </Button>
      </SheetContent>
    </Sheet>
  );
}

export default HeaderMenu;
