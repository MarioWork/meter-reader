// The only entry point: build, listen, shut down. Nothing else has side effects at import time.
import { buildApp } from './app.ts';
import { env } from './config/env.ts';
import { logger } from './lib/logger.ts';
import { assertUploadsWritable } from './lib/uploads.ts';
import { addSetupCode, getSetupLink } from './modules/auth/setup/setup.service.ts';
import { refreshMailToken } from './modules/mail/mail.service.ts';

const SHUTDOWN_TIMEOUT_MS = 10_000;
const LISTEN_HOST = '0.0.0.0';
// The Hotmail token is renewed this often: well inside the access token's hour, and a revoked token shows on the web
// app's banner within this long.
const MAIL_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'uncaught exception');
  process.exit(1);
});

// A photo that cannot be written should stop the start, not fail later in front of the user.
await assertUploadsWritable();

const app = await buildApp();

// Until the app is set up, each start prints a fresh one-time setup link (ADR 0002). It is a secret, so it goes to
// stdout as plain text, never into the structured log a log shipper might keep.
const setupCode = await addSetupCode();

if (setupCode) {
  logger.warn('not set up yet: open the setup link printed in this log');
  process.stdout.write(`\nOpen this link to set up the login (works once):\n${getSetupLink(setupCode)}\n\n`);
}

await app.listen({ port: env.PORT, host: LISTEN_HOST });

// The server keeps the Hotmail token alive by itself, from start (ADR 0001). refreshMailToken never rejects (a failure
// is logged and the next round tries again), so the promise kept here is only awaited at shutdown, which also cuts a
// refresh still waiting on Microsoft short.
const mailRefreshAbort = new AbortController();
let mailRefresh = refreshMailToken(mailRefreshAbort.signal);
const mailRefreshTimer = setInterval(() => {
  mailRefresh = refreshMailToken(mailRefreshAbort.signal);
}, MAIL_REFRESH_INTERVAL_MS);

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  logger.info({ signal }, 'shutting down');

  // Stop taking requests, finish in-flight ones, close the database; force exit if that hangs.
  const forceExit = setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  // A refresh still running is cut short and allowed to finish its write before the database closes.
  clearInterval(mailRefreshTimer);
  mailRefreshAbort.abort();
  await mailRefresh;

  await app.close();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
