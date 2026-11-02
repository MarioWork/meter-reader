import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { MailStatusResponseSchema } from './mail.schema.ts';
import { getMailStatus } from './mail.service.ts';

const TAGS = ['mail'];

export const mailRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/status',
    {
      schema: {
        tags: TAGS,
        summary: 'Whether the server can send mail from Hotmail (yarn mail:connect has run and still holds)',
        response: { 200: MailStatusResponseSchema },
      },
    },
    async () => getMailStatus(),
  );
};
