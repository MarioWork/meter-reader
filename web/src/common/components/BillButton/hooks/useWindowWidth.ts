import { useSyncExternalStore } from 'react';

function subscribeToResize(onResize: () => void) {
  window.addEventListener('resize', onResize);

  return () => window.removeEventListener('resize', onResize);
}

function readWindowWidth(): number {
  return window.innerWidth;
}

// The window's width in CSS pixels, kept current as it resizes or the phone turns.
export function useWindowWidth(): number {
  return useSyncExternalStore(subscribeToResize, readWindowWidth);
}
