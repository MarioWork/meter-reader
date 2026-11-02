import { z } from 'zod';
import { normalisePassword } from '../../../lib/passwordHash.ts';
import { ID_MAX_LENGTH, PASSWORD_MAX_LENGTH, RegistrationResponseSchema } from '../auth.schema.ts';

// NIST SP 800-63B-4: at least 15 characters for a password used on its own (ADR 0002).
export const PASSWORD_MIN_LENGTH = 15;

const SetupCodeSchema = z.string().min(1).max(ID_MAX_LENGTH);

const PASSWORD_LENGTH_MESSAGE = `Use at least ${PASSWORD_MIN_LENGTH} characters`;

// Never trimmed: every character typed is part of the password. No character-mix rules. The length is counted the way
// the password is hashed (NFKC), so combining accents cannot pad a shorter one past the limit.
const NewPasswordSchema = z
  .string()
  .max(PASSWORD_MAX_LENGTH)
  .refine((password) => normalisePassword(password).length >= PASSWORD_MIN_LENGTH, PASSWORD_LENGTH_MESSAGE);

export const SetupOptionsSchema = z.strictObject({
  code: SetupCodeSchema,
});

// A password, a passkey (the browser's answer to the options above), or both; never neither.
export const SetupSchema = z
  .strictObject({
    code: SetupCodeSchema,
    password: NewPasswordSchema.optional(),
    passkey: RegistrationResponseSchema.optional(),
  })
  .refine((setup) => setup.password !== undefined || setup.passkey !== undefined, {
    message: 'Set a password, add a passkey, or both',
  });

export type SetupOptions = z.infer<typeof SetupOptionsSchema>;
export type Setup = z.infer<typeof SetupSchema>;
