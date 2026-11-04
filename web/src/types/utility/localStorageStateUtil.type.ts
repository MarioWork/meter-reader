// A value kept in this browser's storage and its setter, shaped like useState's (useLocalStorage).
export type LocalStorageStateUtil<Value extends string> = [Value, (value: Value) => void];
