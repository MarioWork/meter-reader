import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { SettingsResponseSchema, UpdateSettingsSchema } from './settings.schema.ts';
import { getSettings, updateSettings } from './settings.service.ts';

const TAGS = ['settings'];

// Every route needs a session: the auth plugin locks every route that is not marked public (ADR 0002).
export const settingsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      schema: {
        tags: TAGS,
        summary:
          "The app's settings: the provider's address, who the email is from, the subject and body templates, and the date format",
        response: { 200: SettingsResponseSchema, 401: ErrorResponseSchema },
      },
    },
    async () => getSettings(),
  );

  app.put(
    '/',
    {
      schema: {
        tags: TAGS,
        summary:
          "Save the provider's address, the subject and body templates and the date format every reading's email is filled in from",
        body: UpdateSettingsSchema,
        response: { 200: SettingsResponseSchema, 400: ErrorResponseSchema, 401: ErrorResponseSchema },
      },
    },
    async (request) => updateSettings(request.body),
  );
};
