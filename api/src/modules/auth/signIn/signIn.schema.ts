import { z } from 'zod';
import { AuthenticationResponseSchema, PASSWORD_MAX_LENGTH } from '../auth.schema.ts';

// Sign-in only checks the shape: a wrong length is just a wrong password, with the same answer as any other.
// No username: there is one account.
export const PasswordSignInSchema = z.strictObject({
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

export const PasskeySignInSchema = z.strictObject({
  response: AuthenticationResponseSchema,
});

export type PasswordSignIn = z.infer<typeof PasswordSignInSchema>;
export type PasskeySignIn = z.infer<typeof PasskeySignInSchema>;
