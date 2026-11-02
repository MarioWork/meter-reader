import { useEffect, useId, useRef } from 'react';
import Button from '@components/Button';

type Props = {
  isOpen: boolean;
  title: string;
  // What will happen, and anything to say after a failed try (a FormAlert).
  children: React.ReactNode;
  confirmLabel: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// A yes/no question before something that cannot be undone. A native modal <dialog>: the browser keeps keyboard
// focus inside it (the page behind is inert), Escape cancels, and focus goes back to the control that opened it.
// Cancel comes first, so it takes the focus when the dialog opens: Enter alone never confirms.
function ConfirmDialog({ isOpen, title, children, confirmLabel, isConfirming = false, onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  // showModal() and close() are the only way into and out of the top layer, so the DOM follows `isOpen` here.
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();

    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  // Escape: the parent closes the dialog through `isOpen`, so the browser must not close it on its own.
  const handleCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={handleCancel}
      className="m-auto max-w-md rounded-sm p-6 shadow-lg backdrop:bg-gray-900/50"
    >
      <h2 id={titleId} className="text-lg font-bold">
        {title}
      </h2>
      <div id={messageId} className="mt-2 flex flex-col gap-2">
        {children}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button isDisabled={isConfirming} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;
