import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  // A PostgreSQL URL: postgresql://user:password@host:5432/database.
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  // How many reverse proxies sit in front of the API: 1 behind Caddy, 0 when it is reached directly. Fastify then
  // reads the client address from X-Forwarded-For, so rate limits count each device instead of the proxy.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  // Comma-separated list of allowed browser origins; never `*`. Empty (the default) turns CORS off: the app is
  // same-origin in production (Caddy), so only a separate client would need it.
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url())),
});

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // The logger depends on env, so this is the one place console is allowed.
  console.error('Invalid environment:\n' + z.prettifyError(parsed.error));
  process.exit(1);
}

export const env: Readonly<Env> = Object.freeze(parsed.data);
