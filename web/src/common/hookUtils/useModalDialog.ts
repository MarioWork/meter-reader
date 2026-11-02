import { useEffect, useLayoutEffect, useRef } from 'react';

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

  // A dialog that leaves the page while open (a routed modal whose route is left) is closed first, while it is still
  // in the page: closing is what hands focus back to the control that opened it. A layout effect, because its cleanup
  // runs before React removes the element; a passive one would run after, with focus already lost.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;

    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return dialogRef;
}
