import { useId } from 'react';
import Button from '@components/Button';
import { useModalDialog } from '@hooks/useModalDialog';

type Props = {
  isOpen: boolean;
  title: string;
  // What will happen, and anything to say after a failed try (a FormAlert).
  children: React.ReactNode;
  confirmLabel: string;
  isConfirming?: boolean;
  // The question can be read, but not said yes to yet (the message inside says why).
  isConfirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// A yes/no question before something that cannot be undone. A native modal <dialog>: the browser keeps keyboard
// focus inside it (the page behind is inert), Escape cancels, and focus goes back to the control that opened it.
// Cancel comes first, so it takes the focus when the dialog opens: Enter alone never confirms.
function ConfirmDialog({
  isOpen,
  title,
  children,
  confirmLabel,
  isConfirming = false,
  isConfirmDisabled = false,
  onConfirm,
  onCancel,
}: Props) {
  const dialogRef = useModalDialog(isOpen);
  const titleId = useId();
  const messageId = useId();

  // Escape: the parent closes the dialog through `isOpen`, so the browser must not close it on its own. Once the
  // action is under way it cannot be called back, so Escape does nothing until it is done.
  const handleCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();

    if (!isConfirming) onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={handleCancel}
      className="m-auto max-w-md rounded-sm bg-popover p-6 text-popover-foreground shadow-lg backdrop:bg-scrim/50"
    >
      <h2 id={titleId} className="text-lg font-bold">
        {title}
      </h2>
      <div id={messageId} className="mt-2 flex flex-col gap-2">
        {children}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" isDisabled={isConfirming} onClick={onCancel}>
          Cancel
        </Button>
        <Button isDisabled={isConfirming || isConfirmDisabled} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;
