import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import type { FastifyRequest } from 'fastify';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { ContentTooLargeError } from '../../lib/httpErrors.ts';
import {
  AddBillBodySchema,
  BILL_MAX_BYTES,
  BillFileQuerySchema,
  BillFileSchema,
  BillParamsSchema,
  BillResponseSchema,
} from './bills.schema.ts';
import { addBill, getBillFile } from './bills.service.ts';
import { BILL_CONTENT_TYPES } from './bills.type.ts';

const TAGS = ['bills'];
const ANY_CONTENT_TYPE = '*';
const BYTES_PER_MEGABYTE = 1_000_000;
const TOO_LARGE_MESSAGE = `The bill must be at most ${BILL_MAX_BYTES / BYTES_PER_MEGABYTE} MB`;
// A bill never changes under its id (replacing one makes a new id): the browser may keep it, for this user only.
const BILL_CACHE_CONTROL = 'private, max-age=31536000, immutable';
const INLINE = 'inline';
const ATTACHMENT = 'attachment';
// Helmet's page policy is for HTML. A bill is never HTML (its type is fixed and nosniff is on), and a policy on it
// can leave a browser's built-in PDF viewer (Safari's, Firefox's pdf.js) blank, so a bill goes without one.
const CONTENT_SECURITY_POLICY_HEADER = 'content-security-policy';

// Said before the body is read, in the user's words: Fastify's own body limit would answer a bare "too large".
async function refuseTooLarge(request: FastifyRequest): Promise<void> {
  const declaredBytes = Number(request.headers['content-length'] ?? 0);

  if (declaredBytes > BILL_MAX_BYTES) throw new ContentTooLargeError(TOO_LARGE_MESSAGE, 'BILL_TOO_LARGE');
}

// Both routes need a session: the auth plugin locks every route that is not marked public (ADR 0002).
export const billsRoutes: FastifyPluginAsyncZod = async (app) => {
  // Only in this plugin: the body of an upload is the file's bytes, whatever type the client says it is. The
  // service reads the real type from the bytes, so a wrong one is refused with a reason, not a bare 415.
  app.removeAllContentTypeParsers();
  app.addContentTypeParser(ANY_CONTENT_TYPE, { parseAs: 'buffer', bodyLimit: BILL_MAX_BYTES }, (_request, body, done) =>
    done(null, body),
  );

  app.post(
    '/',
    {
      bodyLimit: BILL_MAX_BYTES,
      preParsing: refuseTooLarge,
      schema: {
        tags: TAGS,
        summary: "Upload a reading's bill (a PDF, JPEG or PNG), before the reading is updated with its id",
        consumes: [...BILL_CONTENT_TYPES],
        body: AddBillBodySchema,
        response: {
          201: BillResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          413: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const bill = await addBill(request.body);

      return reply.code(201).send(bill);
    },
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: TAGS,
        summary: 'The bill itself, to open in the browser or, with download=true, to save',
        produces: [...BILL_CONTENT_TYPES],
        params: BillParamsSchema,
        querystring: BillFileQuerySchema,
        response: {
          200: BillFileSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { stream, sizeBytes, contentType, downloadName } = await getBillFile(request.params.id);
      const disposition = request.query.download ? ATTACHMENT : INLINE;

      // Helmet writes its headers straight onto the raw response, before this handler runs.
      reply.raw.removeHeader(CONTENT_SECURITY_POLICY_HEADER);

      return reply
        .type(contentType)
        .header('content-length', sizeBytes)
        .header('content-disposition', `${disposition}; filename="${downloadName}"`)
        .header('cache-control', BILL_CACHE_CONTROL)
        .send(stream);
    },
  );
};
