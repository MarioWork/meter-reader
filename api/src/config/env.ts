import { z } from 'zod';

const HTTPS_PROTOCOL = 'https:';
// The web dev server (cd web && yarn dev).
const DEFAULT_APP_ORIGIN = 'http://localhost:5173';
const DEFAULT_UPLOADS_DIR = './data/uploads';
// ADR 0001: "test" until the provider says what it wants.
const DEFAULT_MAIL_SUBJECT = 'test';

const EnvSchema = z
  .object({
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
    // Where the user opens the app: the setup link points here, and passkeys belong to its host name for good. Only the
    // origin counts (scheme, host, port). Must be https in production.
    APP_ORIGIN: z.url().default(DEFAULT_APP_ORIGIN),
    // The Application (client) id of the app registered in Microsoft Entra for sending mail (README, "Connecting
    // Hotmail"). Not a secret: the app is a public client. Empty until that one-time setup is done; the api still
    // starts, and the web app shows that Hotmail is not connected.
    MICROSOFT_CLIENT_ID: z.string().trim().default(''),
    // The provider's one address: every reading is emailed here. No default: an app that cannot say where readings go
    // has no reason to start.
    PROVIDER_EMAIL: z.email(),
    // The user's own Hotmail address, shown as "From" on every email. Display only: Microsoft sends from whichever
    // account yarn mail:connect signed in. Optional; left empty, the app shows no "From".
    MAIL_FROM: z.preprocess((value) => (value === '' ? undefined : value), z.email().optional()),
    // The subject of every reading's email.
    MAIL_SUBJECT: z.string().trim().min(1).default(DEFAULT_MAIL_SUBJECT),
    // The folder the photos are kept in, relative to where the api starts. In the container it is the
    // ./data/uploads volume, so the photos outlive the container.
    UPLOADS_DIR: z.string().min(1).default(DEFAULT_UPLOADS_DIR),
  })
  .refine((value) => value.NODE_ENV !== 'production' || new URL(value.APP_ORIGIN).protocol === HTTPS_PROTOCOL, {
    message: 'APP_ORIGIN must be https in production',
    path: ['APP_ORIGIN'],
  });

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // The logger depends on env, so this is the one place console is allowed.
  console.error('Invalid environment:\n' + z.prettifyError(parsed.error));
  process.exit(1);
}

export const env: Readonly<Env> = Object.freeze(parsed.data);
