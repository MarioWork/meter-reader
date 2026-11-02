import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/browser';
import { mixed, object, type InferType } from 'yup';
import { newPasswordSchema, passwordSchema, setupCodeSchema } from '@utils/authUtils';

// The browser's answer to a passkey prompt, passed through as the library produced it. The API verifies it.
const registrationResponseSchema = mixed<RegistrationResponseJSON>();
const authenticationResponseSchema = mixed<AuthenticationResponseJSON>().required();

export const PasswordSignInSchema = object({
  password: passwordSchema,
});

export const PasskeySignInSchema = object({
  response: authenticationResponseSchema,
});

export const StartPasskeySetupSchema = object({
  code: setupCodeSchema,
});

// A password, a passkey, or both; the API refuses neither.
export const SetUpSchema = StartPasskeySetupSchema.shape({
  password: newPasswordSchema,
  passkey: registrationResponseSchema,
}).test('has-a-way-in', 'Set a password, add a passkey, or both', (setup) => Boolean(setup.password || setup.passkey));

export type PasswordSignIn = InferType<typeof PasswordSignInSchema>;
export type PasskeySignIn = InferType<typeof PasskeySignInSchema>;
export type StartPasskeySetup = InferType<typeof StartPasskeySetupSchema>;
export type SetUp = InferType<typeof SetUpSchema>;
