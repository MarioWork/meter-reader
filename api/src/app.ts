import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from '@fastify/type-provider-zod';
import Fastify, { LogController } from 'fastify';
import { randomUUID } from 'node:crypto';
import { env } from './config/env.ts';
import { errorHandler, notFoundHandler } from './lib/errorHandler.ts';
import { logger } from './lib/logger.ts';
import { authRoutes } from './modules/auth/auth.route.ts';
import { healthRoutes } from './modules/health/health.route.ts';
import { readingsRoutes } from './modules/readings/readings.route.ts';
import { mailRoutes } from './modules/mail/mail.route.ts';
import { authPlugin } from './plugins/auth.plugin.ts';
import { prismaPlugin } from './plugins/prisma.plugin.ts';

const BODY_LIMIT_BYTES = 1_048_576;
const RATE_LIMIT_MAX = 600;
const RATE_LIMIT_WINDOW = '1 minute';
const DOCS_ROUTE_PREFIX = '/docs';
const AUTH_ROUTE_PREFIX = '/auth';
const READINGS_ROUTE_PREFIX = '/readings';
const MAIL_ROUTE_PREFIX = '/mail';
const REQUEST_LOG_MESSAGE = 'request';
// A request no route matched (a 404) has no pattern to log.
const UNMATCHED_ROUTE = '(no route)';

// Builds the configured instance and never listens: tests call it and use app.inject(); server.ts listens.
export async function buildApp() {
  const app = Fastify({
    loggerInstance: logger,
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
    bodyLimit: BODY_LIMIT_BYTES,
    // Fastify's own two lines per request (incoming + completed) are replaced by one, in the onResponse hook below.
    logController: new LogController({ disableRequestLogging: true }),
    // Trust the nearest TRUST_PROXY_HOPS proxies. A function, because Fastify's types omit the hop-count form.
    trustProxy: (_address: string, hop: number) => hop < env.TRUST_PROXY_HOPS,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  // One line per request, as fields: the route's pattern, never the URL (its query string may hold user input);
  // never headers or bodies. pino-pretty shows it as "GET /ready → 200 (4 ms)".
  app.addHook('onResponse', async (request, reply) => {
    const route = request.routeOptions.url ?? UNMATCHED_ROUTE;
    const durationMs = Math.round(reply.elapsedTime);

    request.log.info({ method: request.method, route, statusCode: reply.statusCode, durationMs }, REQUEST_LOG_MESSAGE);
  });

  // Infrastructure in a fixed order: sensible → cors → helmet → rate-limit → swagger → db → auth → routes.
  await app.register(sensible);
  const hasCorsOrigins = env.CORS_ORIGINS.length > 0;
  if (hasCorsOrigins) {
    await app.register(cors, { origin: env.CORS_ORIGINS });
  }
  await app.register(helmet);
  await app.register(rateLimit, { max: RATE_LIMIT_MAX, timeWindow: RATE_LIMIT_WINDOW });
  await app.register(swagger, {
    openapi: { info: { title: 'Meter Reader API', version: '1.0.0' } },
    transform: jsonSchemaTransform,
  });
  if (env.NODE_ENV !== 'production') {
    await app.register(swaggerUi, { routePrefix: DOCS_ROUTE_PREFIX });
  }
  await app.register(prismaPlugin);
  // Locks every route that does not say `config: { isPublic: true }` (ADR 0002).
  await app.register(authPlugin);

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: AUTH_ROUTE_PREFIX });
  await app.register(readingsRoutes, { prefix: READINGS_ROUTE_PREFIX });
  await app.register(mailRoutes, { prefix: MAIL_ROUTE_PREFIX });

  return app;
}

export type App = Awaited<ReturnType<typeof buildApp>>;
