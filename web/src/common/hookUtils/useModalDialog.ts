import { useEffect, useRef } from 'react';

// A native <dialog> shown as a modal while `isOpen` is true. showModal() and close() are the only way into and out of
// the top layer, so the DOM follows `isOpen` here. Put the returned ref on the <dialog>.
export function useModalDialog(isOpen: boolean) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();

    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return dialogRef;
}
