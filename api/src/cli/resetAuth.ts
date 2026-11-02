// Locked out? Removes the password, every passkey and every session, then prints a new setup link. The readings
// stay (ADR 0002).
// Dev: yarn auth:reset. In the container: docker compose exec api node dist/cli/resetAuth.js
import { logger } from '../lib/logger.ts';
import { prisma } from '../lib/prisma.ts';
import { getSetupLink, resetLogin } from '../modules/auth/setup/setup.service.ts';

const EXIT_FAILED = 1;

try {
  const code = await resetLogin();

  // The link is a secret: plain stdout, never the structured log a log shipper might keep.
  process.stdout.write(`\nLogin removed. Open this link to set it up again (works once):\n${getSetupLink(code)}\n\n`);
} catch (error: unknown) {
  logger.fatal({ err: error }, 'auth:reset failed');
  process.exitCode = EXIT_FAILED;
} finally {
  await prisma.$disconnect();
}
