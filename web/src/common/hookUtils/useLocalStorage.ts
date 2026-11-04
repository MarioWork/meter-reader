import { useSyncExternalStore } from 'react';
import type { LocalStorageStateUtil } from '@app-types/utility';

type Options<Value extends string> = {
  key: string;
  fallback: Value;
  // Only these are taken from storage; anything else there reads as the fallback.
  values: readonly Value[];
};

// Every hook reading storage hears a write made from this tab; the `storage` event only reports other tabs.
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

// Storage can throw (blocked site data, a private window); a failed read is "nothing saved".
function readStoredValue(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

// A preference kept in this browser only, never data the server should hold. A blocked write keeps the old value.
export function useLocalStorage<Value extends string>({
  key,
  fallback,
  values,
}: Options<Value>): LocalStorageStateUtil<Value> {
  const storedValue = useSyncExternalStore(subscribe, () => readStoredValue(key));
  const value = values.find((knownValue) => knownValue === storedValue) ?? fallback;

  const setValue = (nextValue: Value) => {
    try {
      window.localStorage.setItem(key, nextValue);
    } catch {
      // Nothing to do: the choice is not remembered.
    }

    notifyListeners();
  };

  return [value, setValue];
}
