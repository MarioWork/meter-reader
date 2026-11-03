import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { XLSX_CONTENT_TYPE } from '../../lib/spreadsheet.ts';
import { ZIP_CONTENT_TYPE } from '../../lib/zip.ts';
import {
  CostListResponseSchema,
  CreateReadingSchema,
  ExportReadingsQuerySchema,
  ListCostsQuerySchema,
  ListReadingsQuerySchema,
  EmailDefaultsResponseSchema,
  ReadingEmailResponseSchema,
  ReadingListResponseSchema,
  ReadingParamsSchema,
  ReadingResponseSchema,
  ReadingsBackupResponseSchema,
  ReadingsFilesBackupResponseSchema,
  ReadingsSpreadsheetResponseSchema,
  SendReadingSchema,
  UpdateReadingSchema,
} from './readings.schema.ts';
import {
  addReading,
  deleteReading,
  getCosts,
  getEmailDefaults,
  getReading,
  getReadingEmail,
  getReadings,
  getReadingsBackup,
  getReadingsBackupCsv,
  getReadingsFilesBackup,
  getReadingsSpreadsheet,
  sendReading,
  updateReading,
} from './readings.service.ts';

const TAGS = ['readings'];
const CSV_CONTENT_TYPE = 'text/csv; charset=utf-8';

// Saved under this name, never shown in the browser.
function attachment(fileName: string): string {
  return `attachment; filename="${fileName}"`;
}

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

  // Static, so it wins over /:id.
  app.get(
    '/costs',
    {
      schema: {
        tags: TAGS,
        summary: 'The readings that have a Cost, newest first, optionally in a day range, with the sum of their costs',
        querystring: ListCostsQuerySchema,
        response: { 200: CostListResponseSchema, 400: ErrorResponseSchema, 401: ErrorResponseSchema },
      },
    },
    async (request) => getCosts(request.query),
  );

  app.get(
    '/export.xlsx',
    {
      schema: {
        tags: TAGS,
        summary: 'Every reading the filters match (not a page) as an .xlsx spreadsheet, newest first',
        querystring: ExportReadingsQuerySchema,
        produces: [XLSX_CONTENT_TYPE],
        response: { 200: ReadingsSpreadsheetResponseSchema, 400: ErrorResponseSchema, 401: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { fileName, content } = await getReadingsSpreadsheet(request.query);

      return reply.type(XLSX_CONTENT_TYPE).header('content-disposition', attachment(fileName)).send(content);
    },
  );

  // The backup, followed by a plain link on the Settings page: every reading, whatever Home is filtered to.
  app.get(
    '/backup.json',
    {
      schema: {
        tags: TAGS,
        summary: 'Every reading as one JSON download, with its sent email and the file name of its photo',
        response: { 200: ReadingsBackupResponseSchema, 401: ErrorResponseSchema },
      },
    },
    async (_request, reply) => {
      const { fileName, content } = await getReadingsBackup();

      return reply.header('content-disposition', attachment(fileName)).send(content);
    },
  );

  app.get(
    '/backup.csv',
    {
      schema: {
        tags: TAGS,
        summary: 'The same backup as a CSV download, one line per reading',
        produces: [CSV_CONTENT_TYPE],
        response: { 200: z.string(), 401: ErrorResponseSchema },
      },
    },
    async (_request, reply) => {
      const { fileName, content } = await getReadingsBackupCsv();

      return reply.type(CSV_CONTENT_TYPE).header('content-disposition', attachment(fileName)).send(content);
    },
  );

  // Streamed: the files are read one at a time while the zip goes out.
  app.get(
    '/backup.zip',
    {
      schema: {
        tags: TAGS,
        summary:
          'Every Photo in photos/ and every Bill in bills/ as one zip download, under the file names the JSON and CSV ' +
          'backups list',
        produces: [ZIP_CONTENT_TYPE],
        response: { 200: ReadingsFilesBackupResponseSchema, 401: ErrorResponseSchema },
      },
    },
    async (_request, reply) => {
      const { fileName, content } = await getReadingsFilesBackup();

      return reply.type(ZIP_CONTENT_TYPE).header('content-disposition', attachment(fileName)).send(content);
    },
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
        summary:
          'What every email starts with: from, to and the subject and body templates, for a reading not saved yet',
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
        summary: 'Set, change or remove what the reading cost and its bill (null removes either)',
        params: ReadingParamsSchema,
        body: UpdateReadingSchema,
        response: {
          200: ReadingResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
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
