import { env } from '../config/env.ts';

const HTTPS_PROTOCOL = 'https:';
// The browser reaches the api under this path on the app's own origin: web/Caddyfile, and web/vite.config.ts's proxy
// in dev.
const API_PATH = '/api';

const appUrl = new URL(env.APP_ORIGIN);

// Where the user opens the app, read once from env: the setup link points here, the cross-site check compares with
// it, and passkeys belong to its host name for good (never a bare IP address).
export const APP_ORIGIN = appUrl.origin;
export const APP_HOSTNAME = appUrl.hostname;
export const IS_SECURE_APP_ORIGIN = appUrl.protocol === HTTPS_PROTOCOL;
// Where a link the api hands out starts, such as a bill's in a spreadsheet: opened from outside the app, it still
// reaches the api through the same origin, with the session cookie.
export const APP_API_URL = `${APP_ORIGIN}${API_PATH}`;
