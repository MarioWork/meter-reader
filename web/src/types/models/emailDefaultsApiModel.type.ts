import type { MessageDateFormatUtil, MessageDateLanguageUtil } from '@app-types/utility';

// What every email starts with, before there is a reading to build its body from. `from` is the user's own address,
// display only; null when the server has none set.
export interface EmailDefaultsApiModel {
  from: string | null;
  // The provider's address saved in Settings; null until one is saved, and Send stays off until then.
  to: string | null;
  // The templates saved in Settings, with {date}, {reading} (the digits as read) and {client} to fill in.
  subjectTemplate: string;
  bodyTemplate: string;
  // How {date} is written, as chosen in Settings, so the form fills it in the way a send would.
  dateFormat: MessageDateFormatUtil;
  // The language {date} is written in, as chosen in Settings.
  dateLanguage: MessageDateLanguageUtil;
  // The client number saved in Settings, for {client}; null when none is saved.
  clientNumber: string | null;
}
