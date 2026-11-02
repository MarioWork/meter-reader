import { z } from 'zod';
import { ID_MAX_LENGTH, PASSWORD_MAX_LENGTH, RegistrationResponseSchema } from '../auth.schema.ts';

// NIST SP 800-63B-4: at least 15 characters for a password used on its own (ADR 0002).
export const PASSWORD_MIN_LENGTH = 15;

const SetupCodeSchema = z.string().min(1).max(ID_MAX_LENGTH);

// Never trimmed: every character typed is part of the password. No character-mix rules.
const NewPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH);

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
