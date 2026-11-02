import { getErrorLogFields } from '../../lib/databaseErrors.ts';
import { logger } from '../../lib/logger.ts';
import { prisma } from '../../lib/prisma.ts';

const log = logger.child({ module: 'health' });

export const healthRepository = {
  // The readiness probe's one query. The Prisma error stays in this file: it is logged here (codes only, never row
  // data), and the service only learns that the database did not answer.
  isReachable: async (): Promise<boolean> => {
    try {
      await prisma.$queryRaw`select 1`;

      return true;
    } catch (error: unknown) {
      log.error(getErrorLogFields(error), 'readiness check failed: database not reachable');

      return false;
    }
  },
};
