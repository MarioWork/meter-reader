import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import {
  CreateReadingSchema,
  ListReadingsQuerySchema,
  ReadingListResponseSchema,
  ReadingParamsSchema,
  ReadingResponseSchema,
} from './readings.schema.ts';
import { addReading, deleteReading, getReadings } from './readings.service.ts';

const TAGS = ['readings'];

// Every route needs a session: the auth plugin locks every route that is not marked public (ADR 0002).
export const readingsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      schema: {
        tags: TAGS,
        summary: 'The history: every reading, newest first',
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
        response: { 201: ReadingResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const reading = await addReading(request.body);

      return reply.code(201).send(reading);
    },
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
};
