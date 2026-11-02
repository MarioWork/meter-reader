// The API's error envelope for the auth failures the pages react to, with the API's own messages.
const AUTH_ERRORS = {
  invalidSetupCode: { code: 'INVALID_SETUP_CODE', message: 'This setup link is wrong or was already used' },
  alreadySetUp: { code: 'ALREADY_SET_UP', message: 'The app is already set up. Sign in instead.' },
  notSetUp: { code: 'NOT_SET_UP', message: 'Nobody has set the app up yet' },
  passkeyFailed: { code: 'SIGN_IN_FAILED', message: "That passkey didn't work. Try again." },
};

type AuthErrorKind = keyof typeof AUTH_ERRORS;

type AuthErrorMockModel = { code: string; message: string };

export const createAuthErrorMockModel = (kind: AuthErrorKind): AuthErrorMockModel => ({ ...AUTH_ERRORS[kind] });
