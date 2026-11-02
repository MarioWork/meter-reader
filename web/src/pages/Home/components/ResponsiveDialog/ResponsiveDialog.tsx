import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@components/ui/drawer';
import { useIsWideScreen } from './hooks/useIsWideScreen';

type Props = {
  title: string;
  isOpen: boolean;
  onOpenChange: (isOpening: boolean) => void;
  // The buttons at the bottom; they always include a visible way to close, so nothing needs a swipe (WCAG 2.5.7).
  footer: React.ReactNode;
  children: React.ReactNode;
};

// A bottom sheet on a phone, where it sits under the thumb; a centred dialog on a wider screen. Both trap focus while
// open and hand it back on close. The caller owns whether it is open: a routed modal is open for as long as its route.
function ResponsiveDialog({ title, isOpen, onOpenChange, footer, children }: Props) {
  const isWideScreen = useIsWideScreen();

  if (isWideScreen) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {children}
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4">{children}</div>
        <DrawerFooter>{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default ResponsiveDialog;
