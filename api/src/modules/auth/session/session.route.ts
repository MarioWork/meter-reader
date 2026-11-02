import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { TAGS, clearSessionCookie } from '../auth.routeOptions.ts';
import { AuthStatusResponseSchema } from './session.schema.ts';
import { deleteSession, getAuthStatus } from './session.service.ts';

export const sessionRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/status',
    {
      config: { isPublic: true },
      schema: {
        tags: TAGS,
        summary: 'Whether the app needs setting up, and whether this browser is signed in',
        response: { 200: AuthStatusResponseSchema },
      },
    },
    async (request) => getAuthStatus(request.session),
  );

  // Public on purpose: an expired or unknown cookie still gets cleared.
  app.post(
    '/logout',
    {
      config: { isPublic: true },
      schema: {
        tags: TAGS,
        summary: 'Sign this browser out (always clears the cookie)',
        response: { 204: z.undefined() },
      },
    },
    async (request, reply) => {
      if (request.session) await deleteSession(request.session);
      clearSessionCookie(reply);

      return reply.code(204).send();
    },
  );
};
