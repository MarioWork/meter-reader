import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import {
  CreateReadingSchema,
  ListReadingsQuerySchema,
  ReadingListResponseSchema,
  ReadingResponseSchema,
} from './readings.schema.ts';
import { addReading, getReadings } from './readings.service.ts';

const TAGS = ['readings'];

// Both routes need a session: the auth plugin locks every route that is not marked public (ADR 0002).
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
};
