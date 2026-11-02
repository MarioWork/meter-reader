// The API's error envelope for the auth failures the pages react to, with the API's own messages.
export const AUTH_ERROR_MOCKS = {
  invalidSetupCode: { code: 'INVALID_SETUP_CODE', message: 'This setup link is wrong or was already used' },
  alreadySetUp: { code: 'ALREADY_SET_UP', message: 'The app is already set up. Sign in instead.' },
  notSetUp: { code: 'NOT_SET_UP', message: 'Nobody has set the app up yet' },
  passwordFailed: { code: 'SIGN_IN_FAILED', message: "That password doesn't match. Try again." },
  passkeyFailed: { code: 'SIGN_IN_FAILED', message: "That passkey didn't work. Try again." },
};
