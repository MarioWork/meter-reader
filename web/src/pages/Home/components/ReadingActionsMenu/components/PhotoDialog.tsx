import { useId } from 'react';
import { Button } from '@components/ui/button';
import { useModalDialog } from '@hooks/useModalDialog';

type Props = {
  isOpen: boolean;
  title: string;
  photoUrl: string;
  photoDescription: string;
  // Where focus goes once the dialog has closed.
  returnFocusRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
};

const CLOSE_LABEL = 'Close';

// The full photo in a native modal <dialog>: the browser keeps keyboard focus inside it, and Escape closes it. Focus
// then goes to `returnFocusRef`: the browser would hand it back to the menu item that opened the dialog, which the
// menu has removed by then.
function PhotoDialog({ isOpen, title, photoUrl, photoDescription, returnFocusRef, onClose }: Props) {
  const dialogRef = useModalDialog(isOpen);
  const titleId = useId();

  // Escape: the parent closes the dialog through `isOpen`, so the browser must not close it on its own.
  const handleCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClose={() => returnFocusRef.current?.focus()}
      className="m-auto max-w-[95vw] rounded-sm bg-popover p-4 text-popover-foreground shadow-lg backdrop:bg-scrim/70"
    >
      <h2 id={titleId} className="text-lg font-bold">
        {title}
      </h2>
      {isOpen && <img src={photoUrl} alt={photoDescription} className="mt-2 max-h-[75vh] max-w-full" />}
      <div className="mt-4 flex justify-end">
        <Button onClick={onClose}>{CLOSE_LABEL}</Button>
      </div>
    </dialog>
  );
}

export default PhotoDialog;
