import { XIcon } from 'lucide-react';
import { Button } from '@components/ui/button';
import { DrawerClose } from '@components/ui/drawer';

const CLOSE_LABEL = 'Close';

// The bottom sheet's × in its top corner, like the centred dialog's own. 36 px square, over the 24 px minimum target.
function DrawerCloseButton() {
  return (
    <DrawerClose render={<Button variant="ghost" size="icon-lg" className="absolute top-2 right-2" />}>
      <XIcon aria-hidden="true" />
      <span className="sr-only">{CLOSE_LABEL}</span>
    </DrawerClose>
  );
}

export default DrawerCloseButton;
