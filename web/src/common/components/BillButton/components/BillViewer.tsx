import { useModalDialog } from '@hooks/useModalDialog';

type Props = {
  isOpen: boolean;
  // The id of the heading that names the viewer: the bill's file name.
  titleId: string;
  // Where focus goes once the viewer has closed: the bill's own button.
  returnFocusRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
};

const ESCAPE_KEY = 'Escape';

// The bill, full screen, in a native modal <dialog>: the browser keeps focus inside it and makes the page behind it
// inert. It closes with the ×, with Escape, and with the phone's Back button, which closes a modal dialog by itself.
// It sits in the page next to its button, even inside another dialog: that dialog then counts it as its own, so a tap
// or a swipe in the viewer never closes the dialog behind it.
function BillViewer({ isOpen, titleId, returnFocusRef, onClose, children }: Props) {
  const dialogRef = useModalDialog(isOpen);

  // Escape closes the viewer only. Stopped here, it never reaches the dialog the viewer opened over, which closes
  // on Escape too; prevented, so the browser leaves the closing to `isOpen`.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== ESCAPE_KEY) return;

    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  // However it closed (the browser closes it itself on Back), the state follows, and focus goes back to the button.
  const handleClose = () => {
    onClose();
    returnFocusRef.current?.focus();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Next to a button inside a live region (the cost & bill dialog's saved bill), the viewer is no part of it: the
      // dialog is announced as a dialog, and its own status lines speak for themselves.
      aria-live="off"
      // Focusable from script only: Try again moves focus here while its own button gives way to the loading meter.
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onClose={handleClose}
      // Base UI's bottom sheet would otherwise read a scroll or a pinch here as a swipe to close itself.
      data-base-ui-swipe-ignore=""
      className="fixed inset-0 m-0 size-full max-h-none max-w-none border-0 bg-background p-0 text-left text-base font-normal text-foreground open:flex open:flex-col"
    >
      {children}
    </dialog>
  );
}

export default BillViewer;
