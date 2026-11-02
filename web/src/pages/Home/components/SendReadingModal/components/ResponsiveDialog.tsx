import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@components/ui/drawer';
import { useIsWideScreen } from '../hooks/useIsWideScreen';

type Props = {
  title: string;
  onOpenChange: (isOpening: boolean) => void;
  // The buttons at the bottom; they always include a visible way to close, so nothing needs a swipe (WCAG 2.5.7).
  footer: React.ReactNode;
  children: React.ReactNode;
};

// Always open: the routed preview is open for as long as its route is. A bottom sheet on a phone, where it sits
// under the thumb; a centred dialog on a wider screen. Both trap focus while open and hand it back on close.
function ResponsiveDialog({ title, onOpenChange, footer, children }: Props) {
  const isWideScreen = useIsWideScreen();

  if (isWideScreen) {
    return (
      <Dialog open onOpenChange={onOpenChange}>
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
    <Drawer open onOpenChange={onOpenChange}>
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
