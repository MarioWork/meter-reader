import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import {
  AddPhotoBodySchema,
  PHOTO_CONTENT_TYPE,
  PHOTO_MAX_BYTES,
  PhotoParamsSchema,
  PhotoResponseSchema,
} from './photos.schema.ts';
import { addPhoto, getPhotoFile } from './photos.service.ts';

const TAGS = ['photos'];
// A photo never changes under its id: the browser may keep it as long as it likes, for this user only.
const PHOTO_CACHE_CONTROL = 'private, max-age=31536000, immutable';

const PhotoFileSchema = z.any().meta({ description: 'The photo, a JPEG' });

// Both routes need a session: the auth plugin locks every route that is not marked public (ADR 0002).
export const photosRoutes: FastifyPluginAsyncZod = async (app) => {
  // Only in this plugin: the body of an upload is the JPEG's bytes. Every other route still takes JSON only.
  app.addContentTypeParser(
    PHOTO_CONTENT_TYPE,
    { parseAs: 'buffer', bodyLimit: PHOTO_MAX_BYTES },
    (_request, body, done) => done(null, body),
  );

  app.post(
    '/',
    {
      bodyLimit: PHOTO_MAX_BYTES,
      schema: {
        tags: TAGS,
        summary: 'Upload the photo of a reading, before the reading is saved',
        consumes: [PHOTO_CONTENT_TYPE],
        body: AddPhotoBodySchema,
        response: {
          201: PhotoResponseSchema,
          400: ErrorResponseSchema,
          413: ErrorResponseSchema,
          415: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const photo = await addPhoto(request.body);

      return reply.code(201).send(photo);
    },
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: TAGS,
        summary: 'The photo itself (image/jpeg)',
        produces: [PHOTO_CONTENT_TYPE],
        params: PhotoParamsSchema,
        response: { 200: PhotoFileSchema, 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { stream, sizeBytes } = await getPhotoFile(request.params.id);

      return reply
        .type(PHOTO_CONTENT_TYPE)
        .header('content-length', sizeBytes)
        .header('cache-control', PHOTO_CACHE_CONTROL)
        .send(stream);
    },
  );
};
