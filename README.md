# Meter Reader

Take a photo of your water meter, check the reading, and email it to your water provider from your own Hotmail. One user, one meter, one provider, on your home server.

A reading is sent exactly as read: every digit, leading zeros kept, red digits included. Words used here are defined in [`GLOSSARY.md`](./GLOSSARY.md); the big decisions are in [`docs/adr/`](./docs/adr/).

## Running on the home server

The app is served at `https://meter.home.arpa:8443` (port 8443). Ports 80 and 443 belong to my-funko-collection on the same machine, so this app never uses them.

`compose.yaml` runs four containers:

| Service   | Does                                                                           |
| --------- | ------------------------------------------------------------------------------ |
| `web`     | Caddy: serves the built app over HTTPS on 8443 and proxies `/api/*` to the api |
| `migrate` | Runs once per `up`: applies pending database migrations, then exits            |
| `api`     | The Fastify API on port 3000, reachable only through Caddy                     |
| `db`      | Postgres 18, reachable only by `migrate` and `api`                             |

First time:

1. Make the name resolve on every device that opens the app: a DNS entry on the router, or a line in each device's hosts file, pointing `meter.home.arpa` at the server's LAN address.
2. Copy `.env.example` to `.env` next to `compose.yaml` and set `POSTGRES_PASSWORD` (letters and digits only: it goes inside a database URL). `.env` is never committed.
3. Start everything:

   ```bash
   docker compose up -d --build
   ```

4. Check it: `curl -k https://meter.home.arpa:8443/api/ready` answers `{"status":"ok"}` once the database is up.
5. Trust Caddy's certificate on each device (Caddy uses its own local CA, `tls internal`). Copy it off the server with `docker compose cp web:/data/caddy/pki/authorities/local/root.crt ./meter-reader-root.crt` and install it as a trusted root on the phone or laptop. HTTPS is needed for the camera and for installing the app.

Updating: `git pull`, then `docker compose up -d --build`. The `migrate` service applies any new migrations before the api starts.

Logs: `docker compose logs -f api` (or `web`, `db`, `migrate`).

Data: the Postgres files live in `./data/postgres` (later, photos go in `./data/uploads`). Back up `./data`. Caddy's CA lives in the `caddy_data` volume; keep it, or every device has to trust a new certificate.

## First sign-in

> To do: filled in by a later ticket.

On first start the server prints a one-time setup link. Open it to set a password (15+ characters), a passkey, or both. See [ADR 0002](./docs/adr/0002-one-user-login.md).

## Resetting the login (`auth:reset`)

> To do: filled in by a later ticket.

## Connecting Hotmail (`mail:connect`)

> To do: filled in by a later ticket.

The app sends mail through Microsoft Graph with send-only permission (`Mail.Send`). See [ADR 0001](./docs/adr/0001-send-mail-through-microsoft-graph.md). The provider's address, the subject and the mail settings live in the server `.env`.

## Where data lives

> To do: filled in by a later ticket.

## Local development

Two packages, each with its own `package.json`, Yarn release and Node version (`.node-version`, read by fnm):

| Folder | What                                 | Node |
| ------ | ------------------------------------ | ---- |
| `web/` | The React PWA (Vite)                 | 24   |
| `api/` | The Fastify API (Prisma on Postgres) | 26   |

Run every `yarn` command inside the folder it belongs to. Yarn only, never npm.

### web

```bash
cd web
yarn install
yarn dev
```

Opens on `http://localhost:5173/home`. In dev the API is mocked (MSW), so the api does not need to run. Vite reads `web/.env` and `web/.env.development` (see Environment below).

### api

Needs a local Postgres 18 (Homebrew):

```bash
brew install postgresql@18
cd api
yarn postgres:start          # brew services run postgresql@18
```

Once, make the user and the dev database the default `.env` points at:

```bash
psql -d postgres -c "create role meter with login password 'meter' createdb"
psql -d postgres -c "create database meter_dev owner meter"
```

Then:

```bash
cp .env.example .env         # once; .env is git-ignored
yarn install
yarn dev                     # applies migrations, then runs src/server.ts with --watch
```

The api listens on `http://localhost:3000`. `GET /health` and `GET /ready` answer `{"status":"ok"}`; the OpenAPI docs are at `http://localhost:3000/docs`.

| Script            | Does                                                    |
| ----------------- | ------------------------------------------------------- |
| `yarn dev`        | Migrates, then runs the api in watch mode (pretty logs) |
| `yarn build`      | Compiles `src/` to `dist/`                              |
| `yarn typecheck`  | Type-checks without emitting                            |
| `yarn lint`       | Runs ESLint and the Prettier check                      |
| `yarn test`       | Runs the tests once                                     |
| `yarn db:migrate` | Makes a new migration from `prisma/schema.prisma`       |

The tests need the same local Postgres and the `meter` role: each run makes a migrated `meter_test_template` database, gives every test file its own copy, and drops them all at the end (`api/.env.test`).

CI (`.github/workflows/ci.yml`) runs lint, type-check, tests and build for both packages.

The sections below describe the web starter. They apply inside `web/`.

## Stack

| Area     | Tool                                                 |
| -------- | ---------------------------------------------------- |
| UI       | React 19 with the React Compiler, Tailwind CSS 4     |
| Build    | Vite 8                                               |
| Routing  | React Router 8, data mode (loaders and actions)      |
| Data     | axios                                                |
| Forms    | react-hook-form + yup                                |
| Mocks    | MSW 3 (`msw/vite` plugin, `@msw/playwright` for E2E) |
| Tests    | Vitest 5 + Testing Library, Playwright for E2E       |
| Lint     | ESLint (flat, type-aware) + custom rules, Prettier   |
| Packages | Yarn 4, release committed in `.yarn/releases`        |

## Getting started

```bash
corepack enable   # once per machine; Node 24 ships Corepack, it reads packageManager and runs the committed Yarn
yarn install
yarn dev
```

The app opens on `http://localhost:5173/home`. In dev the API is mocked, so no backend is needed.

Node version: see `.node-version` (fnm reads it).

## Scripts

| Script               | Does                                     |
| -------------------- | ---------------------------------------- |
| `yarn dev`           | Starts the dev server                    |
| `yarn build`         | Type-checks, then builds to `dist/`      |
| `yarn preview`       | Serves the built app                     |
| `yarn lint`          | Runs ESLint and the Prettier check       |
| `yarn format`        | Formats every file with Prettier         |
| `yarn test`          | Runs the unit and component tests once   |
| `yarn test:watch`    | Runs them in watch mode                  |
| `yarn test:coverage` | Runs them with a coverage report         |
| `yarn test-e2e`      | Type-checks `e2e/`, then runs Playwright |

## Environment

Set in `.env` (all modes) and `.env.development` (dev only). Values are read at build time.

| Variable            | Meaning                                                     |
| ------------------- | ----------------------------------------------------------- |
| `VITE_PROJECT_PATH` | Base path the app is served from (`/` by default)           |
| `VITE_BASE_API_URL` | Base URL for every API call                                 |
| `VITE_USE_MOCKS`    | `true` starts MSW in the browser (on in dev, off in builds) |
| `VITE_PLAYWRIGHT`   | `true` under Playwright, which brings its own mocks         |

## Folder structure

```
src/
  application/routes/     route table, path constants, feature route files
  common/
    api/services/         one folder per API service
    components/           shared components (empty)
    hookUtils/            shared hooks (empty)
    utils/                shared helpers and yup rules
  mocks/                  MSW handlers and mock models
  pages/                  one folder per page
  types/
    models/               API models (`*ApiModel`)
    utility/              shared types and value sets (`*Util`)
e2e/                      Playwright config, fixtures, page objects, tests
eslint-rules/             local ESLint rules
```

Aliases: `@api`, `@services`, `@application`, `@app-types`, `@utils`, `@pages`, `@components`, `@hooks`, `@mocks`, `@test-utils`.

## How data flows

The `items` example shows the full path:

1. **Service** (`common/api/services/itemService/`) calls the API with axios.
   - A read returns the data, and a failure throws.
   - A write goes through `axiosActions` (`common/api/axiosActions.ts`). It returns `{ success, data?, error? }` (`JSONResponseUtil`) and never throws on a failed request.
2. **Loader** (`pages/ItemList/itemListLoader.ts`) reads the URL and calls the service before the page renders.
3. **Page** reads the loader's data with `useLoaderData()`.
4. **Form** validates with a yup schema, then submits through React Router's `useFetcher`.
5. **Action** (`itemListActions.ts`) checks the payload against the same schema, then calls the service. The router reloads the loader afterwards.

A yup rule used by both the form and the service lives once in `common/utils/` (see `itemUtils.ts`).

## Adding a feature

1. Add the API model in `src/types/models/` and export it from the barrel.
2. Add the service in `src/common/api/services/<name>Service/`.
3. Add MSW handlers in `src/mocks/handlers/<name>/` and register them in `handlers/index.ts`.
4. Add the page in `src/pages/<Page>/`, with a `<Page>.route.ts` that exports `Component`, `loader` and `action`.
5. Add the path to `routesUtils.ts` and a lazy route in `application/routes/featureRoutes/`.

To start clean, delete the `items` example: its page, service, model, mocks, `itemUtils.ts` and route.

## Conventions enforced by the compiler and the linter

- `tsconfig.app.json` carries Vite's template flags: `erasableSyntaxOnly` (no `enum`, use `as const` value sets), `verbatimModuleSyntax` (`import type` for types), `noUncheckedSideEffectImports`.
- The React Compiler memoizes components; manual `useMemo` / `useCallback` are escape hatches and the `react-hooks` compiler rules lint them.
- Route paths come from `routesUtils.ts`. A literal path in `navigate()`, `to` or `href` is an error.
- A file in `src/types/` that only exports types must end in `.type.ts`.
- Tailwind classes are checked and ordered by `eslint-plugin-better-tailwindcss`; Prettier sorts them the same way.
- E2E tests interact through page objects in `e2e/pages/`, never directly, and never use `waitForTimeout`.
- No snapshot tests.
