import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.ts';
import { env } from '../config/env.ts';
import { logger } from './logger.ts';

// One household on a home server: a small pool is plenty. Timeouts so a stuck database fails a request instead of
// hanging it.
const POOL_MAX_CONNECTIONS = 5;
const CONNECTION_TIMEOUT_MS = 5_000;
const IDLE_TIMEOUT_MS = 30_000;

const log = logger.child({ module: 'db' });

// Query logging prints parameters, so it is a development-only convenience.
const isQueryLogEnabled = env.NODE_ENV === 'development';

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  max: POOL_MAX_CONNECTIONS,
  connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  idleTimeoutMillis: IDLE_TIMEOUT_MS,
});

export const prisma = new PrismaClient({
  adapter,
  // No call arguments in error messages: they would carry the user's data into the logs.
  errorFormat: 'minimal',
  log: isQueryLogEnabled ? [{ emit: 'event', level: 'query' }] : [],
});

if (isQueryLogEnabled) {
  prisma.$on('query', (event) => log.debug({ query: event.query, durationMs: event.duration }, 'query'));
}
