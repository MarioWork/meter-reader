// Every auth job's routes, under /auth: the session (status, signing out), setup, and signing in.
import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { sessionRoutes } from './session/session.route.ts';
import { setupRoutes } from './setup/setup.route.ts';
import { signInRoutes } from './signIn/signIn.route.ts';

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(sessionRoutes);
  await app.register(setupRoutes);
  await app.register(signInRoutes);
};
