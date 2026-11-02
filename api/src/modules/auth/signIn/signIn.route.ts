import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../../lib/errorHandler.ts';
import { AuthenticationOptionsResponseSchema } from '../auth.schema.ts';
import { PUBLIC_CEREMONY_CONFIG, PUBLIC_PASSWORD_CONFIG, TAGS, setSessionCookie } from '../auth.routeOptions.ts';
import { PasskeySignInSchema, PasswordSignInSchema } from './signIn.schema.ts';
import { addPasskeySession, addPasswordSession, getSignInOptions } from './signIn.service.ts';

const SIGNED_IN_RESPONSES = {
  204: z.undefined(),
  400: ErrorResponseSchema,
  401: ErrorResponseSchema,
  429: ErrorResponseSchema,
};

export const signInRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/login/password',
    {
      config: PUBLIC_PASSWORD_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'Sign in with the password: a new session replaces any old one in this browser',
        body: PasswordSignInSchema,
        response: SIGNED_IN_RESPONSES,
      },
    },
    async (request, reply) => {
      const token = await addPasswordSession(request.body, request.session);
      setSessionCookie(reply, token);

      return reply.code(204).send();
    },
  );

  app.post(
    '/login/options',
    {
      config: PUBLIC_CEREMONY_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'Start signing in with a passkey',
        response: { 200: AuthenticationOptionsResponseSchema, 409: ErrorResponseSchema, 429: ErrorResponseSchema },
      },
    },
    async () => getSignInOptions(),
  );

  app.post(
    '/login/verify',
    {
      config: PUBLIC_CEREMONY_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'Finish signing in with a passkey: a new session replaces any old one in this browser',
        body: PasskeySignInSchema,
        response: SIGNED_IN_RESPONSES,
      },
    },
    async (request, reply) => {
      const token = await addPasskeySession(request.body, request.session);
      setSessionCookie(reply, token);

      return reply.code(204).send();
    },
  );
};
