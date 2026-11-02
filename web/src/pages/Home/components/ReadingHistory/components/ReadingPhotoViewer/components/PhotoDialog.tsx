import { useId } from 'react';
import Button from '@components/Button';
import { useModalDialog } from '@hooks/useModalDialog';

type Props = {
  isOpen: boolean;
  title: string;
  photoUrl: string;
  photoDescription: string;
  onClose: () => void;
};

const CLOSE_LABEL = 'Close';

// The full photo in a native modal <dialog>: the browser keeps keyboard focus inside it, Escape closes it, and focus
// goes back to the preview that opened it.
function PhotoDialog({ isOpen, title, photoUrl, photoDescription, onClose }: Props) {
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
      className="m-auto max-w-[95vw] rounded-sm p-4 shadow-lg backdrop:bg-gray-900/70"
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
