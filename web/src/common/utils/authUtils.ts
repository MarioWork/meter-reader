import { string } from 'yup';

// The API's limits (ADR 0002): a new password is 15..256 characters and never trimmed. The common-password list is
// checked by the API only.
export const PASSWORD_MIN_LENGTH = 15;
const PASSWORD_MAX_LENGTH = 256;

// What the sign-in form sends: anything typed. Every character counts, spaces included.
export const passwordSchema = string()
  .required('Type your password')
  .max(PASSWORD_MAX_LENGTH, `Keep it to ${PASSWORD_MAX_LENGTH} characters or fewer`);

// Setup's password: optional (a passkey alone is fine), but 15+ characters when given. An empty field is no password.
export const newPasswordSchema = string()
  .transform((value: string) => (value === '' ? undefined : value))
  .max(PASSWORD_MAX_LENGTH, `Keep it to ${PASSWORD_MAX_LENGTH} characters or fewer`)
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters. A few words in a row works well.`)
  .notRequired();

export const setupCodeSchema = string().trim().required('Open the setup link from the server log');

export const NEW_PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters. A few words in a row is easy to remember and hard to guess.`;
