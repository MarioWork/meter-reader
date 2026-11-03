// What every email starts with, before there is a reading to build its body from. `from` is the user's own address,
// display only; null when the server has none set.
export interface EmailDefaultsApiModel {
  from: string | null;
  // The provider's address saved in Settings; null until one is saved, and Send stays off until then.
  to: string | null;
  subject: string;
  // The body with {date} (spelled out, "3 November 2026") and {reading} (the digits as read) to fill in.
  bodyTemplate: string;
}
