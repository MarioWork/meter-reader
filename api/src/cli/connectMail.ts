// Connects the user's Hotmail once, so the server can send readings from it (ADR 0001). Prints a code; the user
// approves it on any device at Microsoft's sign-in page, and the token is saved in the database. Run it again to
// switch accounts or after the token was revoked.
// Dev: yarn mail:connect. In the container: docker compose exec api node dist/cli/connectMail.js
import { getErrorLogFields } from '../lib/databaseErrors.ts';
import { AppError } from '../lib/errors.ts';
import { logger } from '../lib/logger.ts';
import { prisma } from '../lib/prisma.ts';
import { connectMail, type DeviceLoginPrompt } from '../modules/mail/mail.service.ts';

const EXIT_FAILED = 1;

function showPrompt({ userCode, verificationUri }: DeviceLoginPrompt): void {
  process.stdout.write(
    `\nOn your phone or laptop, open ${verificationUri} and enter this code: ${userCode}\n` +
      'Sign in with the Hotmail account your water provider knows, and allow the app to send mail as you.\n' +
      'Waiting for you to approve it (Ctrl+C to stop)...\n',
  );
}

try {
  await connectMail(showPrompt);

  process.stdout.write('\nHotmail connected. The server renews the token by itself from now on.\n\n');
} catch (error: unknown) {
  const isExpected = error instanceof AppError && error.isOperational;

  // An expected failure (declined, expired, not configured) is a message for the user, not a stack trace.
  if (isExpected) {
    process.stderr.write(`\n${error.message}\n\n`);
  } else {
    logger.fatal(getErrorLogFields(error), 'mail:connect failed');
  }

  process.exitCode = EXIT_FAILED;
} finally {
  await prisma.$disconnect();
}
