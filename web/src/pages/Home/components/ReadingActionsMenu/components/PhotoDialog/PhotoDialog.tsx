import { useId } from 'react';
import { XIcon } from 'lucide-react';
import { Button } from '@components/ui/button';
import { useModalDialog } from '@hooks/useModalDialog';
import PhotoFrame from '../../../PhotoFrame';

type Props = {
  isOpen: boolean;
  title: string;
  // One line under the title: what the meter showed.
  subtitle: string;
  photoUrl: string;
  photoDescription: string;
  // Where focus goes once the dialog has closed.
  returnFocusRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
};

const CLOSE_LABEL = 'Close';

// The full photo in a native modal <dialog>: the browser keeps keyboard focus inside it. Escape, the × at the top
// right or a click outside it closes it. Focus
// then goes to `returnFocusRef`: the browser would hand it back to the menu item that opened the dialog, which the
// menu has removed by then.
function PhotoDialog({ isOpen, title, subtitle, photoUrl, photoDescription, returnFocusRef, onClose }: Props) {
  const dialogRef = useModalDialog(isOpen);
  const titleId = useId();

  // Escape: the parent closes the dialog through `isOpen`, so the browser must not close it on its own.
  const handleCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };

  // A click on the dim backdrop lands on the <dialog> itself; a click on its content lands on the inner box.
  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    const isBackdropClick = event.target === event.currentTarget;

    if (isBackdropClick) onClose();
  };

  return (
    // Escape already closes it from the keyboard; the click is the pointer's extra way out.
    // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events, jsx-a11y-x/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClose={() => returnFocusRef.current?.focus()}
      onClick={handleBackdropClick}
      className="m-auto max-w-[95vw] rounded-xl bg-popover p-0 text-popover-foreground shadow-lg ring-1 ring-foreground/10 backdrop:bg-scrim/70"
    >
      <div className="relative p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-1 pr-10">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={CLOSE_LABEL}
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4"
        >
          <XIcon aria-hidden="true" />
        </Button>
        {isOpen && <PhotoFrame photoUrl={photoUrl} photoDescription={photoDescription} />}
      </div>
    </dialog>
  );
}

export default PhotoDialog;
