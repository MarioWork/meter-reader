import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { BackupResponseSchema } from './backup.schema.ts';
import { getBackup, getBackupCsv } from './backup.service.ts';

const TAGS = ['backup'];
const CSV_CONTENT_TYPE = 'text/csv; charset=utf-8';

// Tells the browser to save the answer as a file under this name instead of showing it.
function attachment(fileName: string): string {
  return `attachment; filename="${fileName}"`;
}

// Downloads, followed by a plain link on the Settings page. Every route needs a session: the auth plugin locks every
// route that is not marked public (ADR 0002), and the browser sends the session cookie with the link.
export const backupRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/readings.json',
    {
      schema: {
        tags: TAGS,
        summary: 'Every reading as one JSON download, with its sent email and the file name of its photo',
        response: { 200: BackupResponseSchema, 401: ErrorResponseSchema },
      },
    },
    async (_request, reply) => {
      const { fileName, content } = await getBackup();

      return reply.header('content-disposition', attachment(fileName)).send(content);
    },
  );

  app.get(
    '/readings.csv',
    {
      schema: {
        tags: TAGS,
        summary: 'The same readings as a CSV download, one line per reading',
        produces: [CSV_CONTENT_TYPE],
        response: { 200: z.string(), 401: ErrorResponseSchema },
      },
    },
    async (_request, reply) => {
      const { fileName, content } = await getBackupCsv();

      return reply.type(CSV_CONTENT_TYPE).header('content-disposition', attachment(fileName)).send(content);
    },
  );
};
