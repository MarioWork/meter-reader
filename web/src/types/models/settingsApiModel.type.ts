import type { MessageDateFormatUtil, MessageDateLanguageUtil } from '@app-types/utility';

// The app's settings, set on the Settings page (ADR 0003).
export interface SettingsApiModel {
  // The user's own address, display only: Microsoft sends from whichever account yarn mail:connect signed in with.
  // Null when the server has none set.
  from: string | null;
  // The provider's address, which every reading is emailed to. Null until the user saves one.
  to: string | null;
  // The user's client number with the provider, filled in for {client}. Null until the user saves one.
  clientNumber: string | null;
  // Every email's subject and body, with {reading}, {date} and {client} to fill in. A fresh install's until the user saves.
  subjectTemplate: string;
  bodyTemplate: string;
  // How {date} is written in every email. A fresh install's ("31 October 2026") until the user saves.
  dateFormat: MessageDateFormatUtil;
  // The language {date} is written in. English until the user saves another.
  dateLanguage: MessageDateLanguageUtil;
}
