// Where the login stands, as GET /auth/status says: not set up yet, set up but this browser is signed out, or
// signed in.
export const AuthStateUtil = {
  SETUP: 'setup',
  SIGNED_OUT: 'signedOut',
  SIGNED_IN: 'signedIn',
} as const;

export type AuthStateUtil = (typeof AuthStateUtil)[keyof typeof AuthStateUtil];
