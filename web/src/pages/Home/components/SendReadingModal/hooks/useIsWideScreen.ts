import { useSyncExternalStore } from 'react';

// Tailwind's `sm` breakpoint: narrower than this is a phone.
const WIDE_SCREEN_QUERY = '(min-width: 40rem)';

function subscribeToScreenWidth(onChange: () => void) {
  const wideScreenQuery = window.matchMedia(WIDE_SCREEN_QUERY);

  wideScreenQuery.addEventListener('change', onChange);

  return () => wideScreenQuery.removeEventListener('change', onChange);
}

function isWideScreenNow() {
  return window.matchMedia(WIDE_SCREEN_QUERY).matches;
}

// True on a screen at least `sm` wide, and it follows the screen as it turns or the window is resized.
export function useIsWideScreen() {
  return useSyncExternalStore(subscribeToScreenWidth, isWideScreenNow);
}
