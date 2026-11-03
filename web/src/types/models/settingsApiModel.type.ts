// The app's settings, set on the Settings page (ADR 0003).
export interface SettingsApiModel {
  // The user's own address, display only: Microsoft sends from whichever account yarn mail:connect signed in with.
  // Null when the server has none set.
  from: string | null;
  // The provider's address, which every reading is emailed to. Null until the user saves one.
  to: string | null;
}
