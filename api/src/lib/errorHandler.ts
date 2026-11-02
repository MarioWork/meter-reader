import { hasZodFastifySchemaValidationErrors } from '@fastify/type-provider-zod';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  PRISMA_RECORD_NOT_FOUND,
  PRISMA_UNIQUE_VIOLATION,
  getErrorLogFields,
  getPrismaErrorCode,
} from './databaseErrors.ts';
import { HttpError } from './httpErrors.ts';

// The one error envelope every route lists for its 4xx/5xx responses.
export const ErrorResponseSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  })
  .meta({ id: 'ErrorResponse' });

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

type MappedError = { statusCode: number; code: string; message: string };

const PRISMA_ERROR_MAP: Record<string, MappedError> = {
  [PRISMA_UNIQUE_VIOLATION]: {
    statusCode: 409,
    code: 'CONFLICT',
    message: 'A record with these values already exists',
  },
  [PRISMA_RECORD_NOT_FOUND]: { statusCode: 404, code: 'NOT_FOUND', message: 'Record not found' },
};

function toDatabaseMappedError(error: unknown): MappedError | undefined {
  const prismaCode = getPrismaErrorCode(error);

  return prismaCode ? PRISMA_ERROR_MAP[prismaCode] : undefined;
}

const INTERNAL_ERROR: ErrorResponse = { code: 'INTERNAL_ERROR', message: 'Something went wrong' };

function isClientError(error: FastifyError): boolean {
  return typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 500;
}

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof HttpError) {
    return reply.code(error.statusCode).send({ code: error.code, message: error.message });
  }

  if (hasZodFastifySchemaValidationErrors(error)) {
    const issues = error.validation.map((issue) => ({
      path: issue.instancePath,
      message: issue.message ?? 'Invalid value',
    }));

    return reply.code(400).send({ code: 'VALIDATION_ERROR', message: 'Request validation failed', issues });
  }

  const mapped = toDatabaseMappedError(error);

  if (mapped) {
    return reply.code(mapped.statusCode).send({ code: mapped.code, message: mapped.message });
  }

  // Fastify's own 4xx (body too large, rate limit, @fastify/sensible httpErrors) keep their status.
  if (isClientError(error)) {
    return reply.code(error.statusCode ?? 400).send({ code: error.code ?? 'REQUEST_ERROR', message: error.message });
  }

  request.log.error(getErrorLogFields(error), 'unhandled error');

  return reply.code(500).send(INTERNAL_ERROR);
}

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(404).send({ code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} not found` });
}
