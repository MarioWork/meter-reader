// What every email starts with, before there is a reading to build its body from. `from` is the user's own address,
// display only; null when the server has none set.
export interface EmailDefaultsApiModel {
  from: string | null;
  to: string;
  subject: string;
}
