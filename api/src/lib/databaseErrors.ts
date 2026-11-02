import { Prisma } from '../generated/prisma/client.ts';

// Prisma's "a unique constraint failed".
export const PRISMA_UNIQUE_VIOLATION = 'P2002';
// Prisma's "the row to update or delete was not found".
export const PRISMA_RECORD_NOT_FOUND = 'P2025';

export function getPrismaErrorCode(error: unknown): string | undefined {
  return error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
}

type ErrorLogFields = { err: unknown };

type DatabaseErrorSummary = { name: string; code: string; model: unknown };

// A Prisma error's message and `meta` can carry the values of the row ("Failing row contains ..."): log the code
// and the model only, never the data.
export function getErrorLogFields(error: unknown): ErrorLogFields {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return { err: error };

  const summary: DatabaseErrorSummary = {
    name: error.name,
    code: error.code,
    model: error.meta?.modelName,
  };

  return { err: summary };
}
