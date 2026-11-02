import { ServiceUnavailableError } from '../../lib/httpErrors.ts';
import { healthRepository } from './health.repository.ts';
import type { HealthResponse } from './health.schema.ts';

const OK_STATUS = 'ok' as const;

// Liveness: the process answers. Nothing to check.
export function getLiveness(): HealthResponse {
  return { status: OK_STATUS };
}

// Readiness: the database answers too. A failure is a 503 NOT_READY; the repository has already logged why.
export async function getReadiness(): Promise<HealthResponse> {
  const isDatabaseReachable = await healthRepository.isReachable();

  if (!isDatabaseReachable) throw new ServiceUnavailableError('Database is not reachable', { code: 'NOT_READY' });

  return getLiveness();
}
