// The email exactly as it went out, the user's edits included. `hasPhoto`: whether the photo was attached.
// `from` is the user's address as the server had it then; null when it had none.
export interface SentEmailApiModel {
  from: string | null;
  to: string;
  subject: string;
  body: string;
  hasPhoto: boolean;
}
