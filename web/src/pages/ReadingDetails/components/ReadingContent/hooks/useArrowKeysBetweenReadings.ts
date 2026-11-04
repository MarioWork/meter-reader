import { useEffect } from 'react';
import { useNavigate, type To } from 'react-router';

type ReadingLinks = {
  previousTo: To | null;
  nextTo: To | null;
};

// Where an arrow key already means something: typing in a field, or moving inside a widget.
const ARROW_KEYS_TAKEN_SELECTOR = [
  'input',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="spinbutton"]',
  '[role="slider"]',
  '[role="listbox"]',
  '[role="menu"]',
  '[role="tablist"]',
  '[role="radiogroup"]',
].join(', ');
// Something open over the page: a dialog (the send preview, the cost & bill dialog, the photo or bill full screen) or
// the "⋯" menu, which its arrow keys move into even while the focus is still on its button.
const OPEN_POPUP_SELECTOR = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';

function isArrowKeyTaken(target: EventTarget | null): boolean {
  const isInWidget = target instanceof Element && target.closest(ARROW_KEYS_TAKEN_SELECTOR) !== null;
  const isPopupOpen = document.querySelector(OPEN_POPUP_SELECTOR) !== null;

  return isInWidget || isPopupOpen;
}

// Alt + ← is the browser's own Back; with any modifier the key is someone else's.
function hasModifier({ altKey, ctrlKey, metaKey, shiftKey }: KeyboardEvent): boolean {
  return altKey || ctrlKey || metaKey || shiftKey;
}

// ← goes to the previous reading and → to the next, like the page's Previous and Next links, while the focus is not in
// a field, a menu or a dialog. A key with no reading that way does nothing.
export function useArrowKeysBetweenReadings({ previousTo, nextTo }: ReadingLinks): void {
  const navigate = useNavigate();

  useEffect(() => {
    const linkByKey: Record<string, To | null> = { ArrowLeft: previousTo, ArrowRight: nextTo };

    function handleKeyDown(event: KeyboardEvent) {
      const to = linkByKey[event.key];
      // A held key repeats: one reading per press, never a run through the history.
      const isIgnored =
        !to || event.repeat || event.defaultPrevented || hasModifier(event) || isArrowKeyTaken(event.target);

      if (isIgnored) return;

      event.preventDefault();
      void navigate(to);
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, previousTo, nextTo]);
}
