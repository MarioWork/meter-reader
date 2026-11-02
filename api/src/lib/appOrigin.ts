import { env } from '../config/env.ts';

const HTTPS_PROTOCOL = 'https:';

const appUrl = new URL(env.APP_ORIGIN);

// Where the user opens the app, read once from env: the setup link points here, the cross-site check compares with
// it, and passkeys belong to its host name for good (never a bare IP address).
export const APP_ORIGIN = appUrl.origin;
export const APP_HOSTNAME = appUrl.hostname;
export const IS_SECURE_APP_ORIGIN = appUrl.protocol === HTTPS_PROTOCOL;
