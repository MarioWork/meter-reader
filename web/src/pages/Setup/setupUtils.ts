// What the setup form sends: the code from the link, the password (may be empty) and whether to add a passkey.
export type SetupFormData = { setup: { code: string; password?: string; hasPasskey: boolean } };

export const SETUP_FAILED_MESSAGE = 'Something went wrong. Please try again.';
