import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import {
  CreateReadingSchema,
  ListReadingsQuerySchema,
  EmailDefaultsResponseSchema,
  ReadingEmailResponseSchema,
  ReadingListResponseSchema,
  ReadingParamsSchema,
  ReadingResponseSchema,
  SendReadingSchema,
  UpdateReadingSchema,
} from './readings.schema.ts';
import {
  addReading,
  deleteReading,
  getEmailDefaults,
  getReading,
  getReadingEmail,
  getReadings,
  sendReading,
  updateReading,
} from './readings.service.ts';

const TAGS = ['readings'];

// Every route needs a session: the auth plugin locks every route that is not marked public (ADR 0002).
export const readingsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      schema: {
        tags: TAGS,
        summary: 'The history, newest first: every reading, or those in a day range and with given statuses',
        querystring: ListReadingsQuerySchema,
        response: { 200: ReadingListResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request) => getReadings(request.query),
  );

  app.post(
    '/',
    {
      schema: {
        tags: TAGS,
        summary: 'Save a reading typed in by hand',
        body: CreateReadingSchema,
        response: { 201: ReadingResponseSchema, 400: ErrorResponseSchema, 409: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const reading = await addReading(request.body);

      return reply.code(201).send(reading);
    },
  );

  app.get(
    '/email-defaults',
    {
      schema: {
        tags: TAGS,
        summary: 'What every email starts with: from, to and the subject, for a reading not saved yet',
        response: { 200: EmailDefaultsResponseSchema, 401: ErrorResponseSchema },
      },
    },
    async () => getEmailDefaults(),
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: TAGS,
        summary: 'One reading, for its details',
        params: ReadingParamsSchema,
        response: {
          200: ReadingResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request) => getReading(request.params.id),
  );

  app.patch(
    '/:id',
    {
      schema: {
        tags: TAGS,
        summary: 'Set, change or remove what the reading cost (null removes it)',
        params: ReadingParamsSchema,
        body: UpdateReadingSchema,
        response: {
          200: ReadingResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request) => updateReading(request.params.id, request.body),
  );

  app.delete(
    '/:id',
    {
      schema: {
        tags: TAGS,
        summary: 'Delete a reading saved by mistake',
        params: ReadingParamsSchema,
        response: { 204: z.undefined(), 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      await deleteReading(request.params.id);

      return reply.code(204).send();
    },
  );

  app.get(
    '/:id/email',
    {
      schema: {
        tags: TAGS,
        summary: "Preview the reading's email: exactly what sending it would send",
        params: ReadingParamsSchema,
        response: {
          200: ReadingEmailResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request) => getReadingEmail(request.params.id),
  );

  app.post(
    '/:id/send',
    {
      schema: {
        tags: TAGS,
        summary: 'Email the reading to the provider from Hotmail; marks it sent, or failed with the reason',
        params: ReadingParamsSchema,
        body: SendReadingSchema,
        response: {
          200: ReadingResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
          413: ErrorResponseSchema,
          502: ErrorResponseSchema,
        },
      },
    },
    async (request) => sendReading(request.params.id, request.body),
  );
};
