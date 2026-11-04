# Local development

[← Back to the README](../../README.md)

## Contents

- [The two packages](#the-two-packages)
- [Run the web app with mocks](#run-the-web-app-with-mocks)
- [Run the whole app without mocks](#run-the-whole-app-without-mocks)
- [Scripts](#scripts)
- [Environment files](#environment-files)
- [CI](#ci)

## The two packages

Each has its own `package.json`, Yarn release and Node version (`.node-version`, read by fnm):

| Folder | What                                 | Node |
| ------ | ------------------------------------ | ---- |
| `web/` | The React PWA (Vite)                 | 24   |
| `api/` | The Fastify API (Prisma on Postgres) | 26   |

Run every `yarn` command inside the folder it belongs to. Yarn only, never npm.

## Run the web app with mocks

The quickest way to see the app: the API is faked in the browser (MSW), so nothing else needs to run.

```bash
cd web
yarn install
yarn dev
```

It opens on `http://localhost:5173/home`.

## Run the whole app without mocks

The real api, a real database and, once connected, real email.

**1. Postgres 18** (Homebrew), once:

```bash
brew install postgresql@18
cd api
yarn postgres:start
psql -d postgres -c "create role meter with login password 'meter' createdb"
psql -d postgres -c "create database meter_dev owner meter"
```

Postgres keeps running until you stop it with `yarn postgres:stop` (in `api/`).

**2. The api**, in its own terminal:

```bash
cd api
cp .env.example .env          # once; .env is git-ignored
yarn install
yarn db:deploy                # applies pending migrations; run again after pulling new ones
yarn dev | yarn pino-pretty
```

It listens on `http://localhost:3000`. `GET /health` and `GET /ready` answer `{"status":"ok"}`, and the OpenAPI docs
are at `http://localhost:3000/docs`.

**3. The web app with the mocks off**, in a second terminal:

```bash
cd web
echo "VITE_USE_MOCKS=false" > .env.development.local
yarn dev
```

`.env.development.local` is git-ignored. Delete it to go back to the mocks. The dev server proxies `/api/<path>` to
`http://localhost:3000/<path>`, the same way Caddy does on the server.

**4. Sign in.** On a fresh database the api prints a setup link to `http://localhost:5173/setup?code=…`. Open it and
make your login ([Signing in](./sign-in.md)).

**5. Connect Hotmail**, to send for real: [Connecting Hotmail](./hotmail.md). In local development the client ID goes
in `api/.env`.

Tip: for a first test, set **To** in Settings to your own address, so the provider gets no test email.

## Scripts

### web

| Script               | Does                                     |
| -------------------- | ---------------------------------------- |
| `yarn dev`           | Starts the dev server                    |
| `yarn build`         | Type-checks, then builds to `dist/`      |
| `yarn preview`       | Serves the built app                     |
| `yarn typecheck`     | Type-checks without emitting             |
| `yarn lint`          | Runs ESLint and the Prettier check       |
| `yarn format`        | Formats every file with Prettier         |
| `yarn test`          | Runs the unit and component tests once   |
| `yarn test:watch`    | Runs them in watch mode                  |
| `yarn test:coverage` | Runs them with a coverage report         |
| `yarn test-e2e`      | Type-checks `e2e/`, then runs Playwright |

### api

| Script              | Does                                                           |
| ------------------- | -------------------------------------------------------------- |
| `yarn dev`          | Runs the api in watch mode (JSON logs; pipe to `pino-pretty`)  |
| `yarn build`        | Compiles `src/` to `dist/`                                     |
| `yarn typecheck`    | Type-checks without emitting                                   |
| `yarn lint`         | Runs ESLint and the Prettier check                             |
| `yarn test`         | Runs the tests once                                            |
| `yarn db:deploy`    | Applies pending migrations                                     |
| `yarn db:migrate`   | Makes a new migration from `prisma/schema.prisma`              |
| `yarn db:generate`  | Regenerates the Prisma client (`yarn install` already does it) |
| `yarn auth:reset`   | Removes the login and prints a new setup link (data is kept)   |
| `yarn mail:connect` | Signs the server in to Hotmail ([guide](./hotmail.md))         |

The api tests need the same local Postgres and the `meter` role: each run makes a migrated `meter_test_template`
database, gives every test file its own copy, and drops them all at the end (`api/.env.test`).

## Environment files

Each `.env` belongs to the folder that reads it:

| File                           | Read by               | Holds                                                                 |
| ------------------------------ | --------------------- | --------------------------------------------------------------------- |
| `.env` (repo root)             | `docker compose`      | Compose values only: `POSTGRES_PASSWORD`, `MICROSOFT_CLIENT_ID`, `MAIL_FROM` |
| `web/.env.development`         | `yarn dev` in `web/`  | The `VITE_*` dev values (committed, nothing secret)                   |
| `web/.env.development.local`   | `yarn dev` in `web/`  | Your own overrides, such as `VITE_USE_MOCKS=false` (git-ignored)      |
| `web/.env.example`             | nobody                | Every `VITE_*` key; copy to `.env.development.local`                  |
| `api/.env`                     | `yarn dev` in `api/`  | The api's settings (copy `api/.env.example`, git-ignored)             |
| `api/.env.test`                | `yarn test` in `api/` | The test settings (committed)                                         |

`VITE_*` values are built into the bundle, so they are never secrets:

| Variable            | Meaning                                                     |
| ------------------- | ----------------------------------------------------------- |
| `VITE_PROJECT_PATH` | Base path the app is served from (`/` by default)           |
| `VITE_BASE_API_URL` | Base URL for every API call (`/api`, proxied to the api)    |
| `VITE_USE_MOCKS`    | `true` starts MSW in the browser (on in dev, off in builds) |
| `VITE_PLAYWRIGHT`   | `true` under Playwright, which brings its own mocks         |

An older checkout may still have `VITE_*` lines in a root `.env`. Nothing reads them there any more: move any value
you changed to `web/.env.development.local`.

## CI

`.github/workflows/ci.yml` runs lint, type-check, tests and build for both packages.
