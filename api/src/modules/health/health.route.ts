import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { HealthResponseSchema } from './health.schema.ts';
import { getLiveness, getReadiness } from './health.service.ts';

const TAGS = ['health'];
// Probes answer without a session: Docker's health check and Caddy call them (ADR 0002 locks everything else).
const PUBLIC_CONFIG = { isPublic: true };

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/health',
    {
      config: PUBLIC_CONFIG,
      schema: { tags: TAGS, summary: 'Liveness probe', response: { 200: HealthResponseSchema } },
    },
    async () => getLiveness(),
  );

  app.get(
    '/ready',
    {
      config: PUBLIC_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'Readiness probe',
        response: { 200: HealthResponseSchema, 503: ErrorResponseSchema },
      },
    },
    async () => getReadiness(),
  );
};
