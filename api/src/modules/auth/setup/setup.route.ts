import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../../lib/errorHandler.ts';
import { RegistrationOptionsResponseSchema } from '../auth.schema.ts';
import { PUBLIC_CEREMONY_CONFIG, PUBLIC_PASSWORD_CONFIG, TAGS, setSessionCookie } from '../auth.routeOptions.ts';
import { SetupOptionsSchema, SetupSchema } from './setup.schema.ts';
import { completeSetup, getSetupOptions } from './setup.service.ts';

export const setupRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/setup/options',
    {
      config: PUBLIC_CEREMONY_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'Setup: start making a passkey (needs the code from the setup link)',
        body: SetupOptionsSchema,
        response: {
          200: RegistrationOptionsResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          409: ErrorResponseSchema,
          429: ErrorResponseSchema,
        },
      },
    },
    async (request) => getSetupOptions(request.body),
  );

  // The password limit: this route takes a password too.
  app.post(
    '/setup',
    {
      config: PUBLIC_PASSWORD_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'Setup: save the password and/or passkey, sign in, and end the setup link',
        body: SetupSchema,
        response: {
          204: z.undefined(),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          409: ErrorResponseSchema,
          429: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const token = await completeSetup(request.body);
      setSessionCookie(reply, token);

      return reply.code(204).send();
    },
  );
};
