import { XIcon } from 'lucide-react';
import { useId } from 'react';
import { Button } from '@components/ui/button';
import { useModalDialog } from '@hooks/useModalDialog';

type Props = {
  isOpen: boolean;
  title: string;
  photoUrl: string;
  photoDescription: string;
  // Where focus goes once the photo has closed: the photo it was opened from.
  returnFocusRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
};

const CLOSE_LABEL = 'Close';

// The photo across the whole screen, in a native modal <dialog>: the browser keeps keyboard focus inside it and the
// page behind out of reach. Escape or Close shuts it, and focus goes back to the photo on the page.
function FullScreenPhoto({ isOpen, title, photoUrl, photoDescription, returnFocusRef, onClose }: Props) {
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
      className="m-0 size-full max-h-none max-w-none bg-scrim p-0 backdrop:bg-scrim"
    >
      <h2 id={titleId} className="sr-only">
        {title}
      </h2>
      {isOpen && <img src={photoUrl} alt={photoDescription} className="size-full object-contain" />}
      <Button
        variant="secondary"
        size="lg"
        onClick={onClose}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4"
      >
        <XIcon aria-hidden="true" />
        {CLOSE_LABEL}
      </Button>
    </dialog>
  );
}

export default FullScreenPhoto;
