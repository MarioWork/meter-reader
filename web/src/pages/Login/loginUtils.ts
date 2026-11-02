import type { PasswordSignIn } from '@services/authService/authService.type';

// Which way in the login form was used: the action picks the matching sign-in.
export const LoginIntents = {
  PASSWORD: 'password',
  PASSKEY: 'passkey',
} as const;
export type LoginIntents = (typeof LoginIntents)[keyof typeof LoginIntents];

export type LoginFormData = { intent: LoginIntents; credentials?: PasswordSignIn };

export const SIGN_IN_FAILED_MESSAGE = 'Something went wrong. Please try again.';
