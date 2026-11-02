import type { CookieSerializeOptions } from '@fastify/cookie';
import { env } from '../config/env.ts';

const SECONDS_PER_DAY = 24 * 60 * 60;

// The cookie's life matches the session's longest life; the server still checks both timeouts on every request.
export const SESSION_MAX_AGE_SECONDS = 30 * SECONDS_PER_DAY;

const isSecureOrigin = new URL(env.APP_ORIGIN).protocol === 'https:';

// `__Host-` makes the browser refuse the cookie unless it is Secure, host-only and Path=/. Plain http (local dev)
// cannot carry a Secure cookie, so there it is a plain name with the same other flags.
export const SESSION_COOKIE_NAME = isSecureOrigin ? '__Host-session' : 'session';

// HttpOnly: page scripts cannot read it. SameSite=Strict: no other site can make the browser send it.
export const SESSION_COOKIE_OPTIONS: CookieSerializeOptions = {
  httpOnly: true,
  secure: isSecureOrigin,
  sameSite: 'strict',
  path: '/',
};
