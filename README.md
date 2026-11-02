# Meter Reader

Take a photo of your water meter, check the reading, and email it to your water provider from your own Hotmail. One user, one meter, one provider, on your home server.

A reading is sent exactly as read: every digit, leading zeros kept, red digits included. Words used here are defined in [`docs/GLOSSARY.md`](./docs/GLOSSARY.md); the big decisions are in [`docs/adr/`](./docs/adr/).

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
2. Copy `.env.example` to `.env` next to `compose.yaml` and set `POSTGRES_PASSWORD` (letters and digits only: it goes inside a database URL) and `PROVIDER_EMAIL` (your water provider's address: every reading is emailed there). `.env` is never committed.
3. Make the photo folder, owned by the api container's user (uid 1000). Without it the api stops at start with "The uploads folder … is not writable":

   ```bash
   mkdir -p data/uploads && sudo chown 1000:1000 data/uploads
   ```

4. Start everything:

   ```bash
   docker compose up -d --build
   ```

5. Check it: `curl -k https://meter.home.arpa:8443/api/ready` answers `{"status":"ok"}` once the database is up.
6. Trust Caddy's certificate on each device (Caddy uses its own local CA, `tls internal`). Copy it off the server with `docker compose cp web:/data/caddy/pki/authorities/local/root.crt ./meter-reader-root.crt` and install it as a trusted root on the phone or laptop. HTTPS is needed for the camera and for installing the app.

Updating: `git pull`, then `docker compose up -d --build`. The `migrate` service applies any new migrations before the api starts. An older `.env` without `PROVIDER_EMAIL` stops `docker compose up` with "set PROVIDER_EMAIL in .env": add it.

Logs: `docker compose logs -f api` (or `web`, `db`, `migrate`).

Data: the Postgres files live in `./data/postgres` and the photos in `./data/uploads` (one JPEG per photo, named by the server). Back up `./data`. Caddy's CA lives in the `caddy_data` volume; keep it, or every device has to trust a new certificate.

## First sign-in

The app has one login (see [ADR 0002](./docs/adr/0002-one-user-login.md)). Every page except the login and setup pages, and every api route except `/health` and `/ready`, needs it.

1. Start the app (`docker compose up -d --build`). While nobody has set it up, every api start prints a one-time setup link in the log:

   ```bash
   docker compose logs api | grep "/setup?code="
   ```

   It looks like `https://meter.home.arpa:8443/setup?code=…`. Each restart prints a new one and the old one stops working.

2. Open the link on your phone or laptop. Choose how you sign in:
   - a **password** of at least 15 characters (a few words in a row works well; very common passwords are refused),
   - a **passkey** on this device (Face ID, Touch ID or a passkey manager), or
   - **both**.
3. Press **Finish setup**. You are signed in and the setup link is dead.

After that, the login page offers the password and the passkey. Five wrong passwords in a minute from one device get "too many tries"; wait a minute and try again. There is no lockout.

A passkey belongs to the address it was made on (`meter.home.arpa`). Open the app by that name, never by IP address, or the passkey will not work.

## Resetting the login (`auth:reset`)

Forgot the password and lost the passkey? Reset the login on the server. It removes the password, every passkey and every session, then prints a new setup link. Readings, photos and mail settings are kept.

```bash
docker compose exec api node dist/cli/resetAuth.js
```

In local development: `cd api && yarn auth:reset`.

Open the printed link and set up the login again, as in **First sign-in**. Anyone who can run this already has a shell on the server, so it needs no password.

## Connecting Hotmail (`mail:connect`)

The app sends readings from your own Hotmail through Microsoft Graph (see [ADR 0001](./docs/adr/0001-send-mail-through-microsoft-graph.md)). It asks for one mail permission only, `Mail.Send` (plus `offline_access`, so the token can renew itself): it can send mail as you, but never read, list or delete it. The provider's address (`PROVIDER_EMAIL`, required) and the subject (`MAIL_SUBJECT`, `test` by default) live in the `.env` next to `compose.yaml`, or `api/.env` in local development.

Until Hotmail is connected, the app shows a banner: "Hotmail not connected". Connecting takes two one-time steps.

### 1. Register the app with Microsoft (once)

1. Open the [Microsoft Entra admin center](https://entra.microsoft.com) and sign in with a Microsoft account. If it says you need a directory (tenant), create a free Azure account first: it makes one.
2. Go to **Applications → App registrations → New registration**.
   - Name: `Meter Reader`.
   - Supported account types: **Personal Microsoft accounts only**.
   - Redirect URI: leave empty.
   - Press **Register**.
3. On the app's **Overview**, copy the **Application (client) ID**.
4. **Authentication** → **Advanced settings** → **Allow public client flows**: **Yes**. Save. (This turns on the device code sign-in. There is no client secret.)
5. **API permissions**: **Add a permission → Microsoft Graph → Delegated permissions**, tick `Mail.Send` and `offline_access`, and add them. Remove `User.Read` if it is listed. No admin consent is needed: you approve the permission yourself when you sign in.
6. Put the client id in the `.env` next to `compose.yaml`, then restart the api:

   ```bash
   echo "MICROSOFT_CLIENT_ID=<the Application (client) ID>" >> .env
   docker compose up -d
   ```

   The client id is not a secret. In local development it goes in `api/.env` instead.

### 2. Sign in to Hotmail (once, and again if the token is ever revoked)

```bash
docker compose exec api node dist/cli/connectMail.js
```

In local development: `cd api && yarn mail:connect`.

It prints a code and an address (`https://www.microsoft.com/link` or `microsoft.com/devicelogin`). On your phone or laptop, open the address, type the code, sign in with **the Hotmail account your water provider knows**, and accept "Send mail as you". The command then says "Hotmail connected" and saves the token in the database. The code works for 15 minutes; if it runs out, run the command again.

After that the server renews the token by itself, every 30 minutes, and saves each new one. Nothing needs doing between readings.

### Sending a reading

In the history, **Send** on a reading opens its email exactly as it will go out: the provider's address, the subject, the body (the date and the reading as read) and, when the reading has a photo, an **Attach photo** toggle. **Send** emails it from your Hotmail; the reading then shows "Sent" with the time. If Microsoft does not take it, the preview says why, the reading shows "Failed", and **Try again** opens the preview again. Send is off while Hotmail is not connected.

Graph takes at most 4 MB per email, and the photo travels in it as base64, a third bigger than the file. A photo over about 2.9 MB cannot be attached: the app says so before asking Microsoft anything, and the reading can still be sent without it.

### When the banner comes back

The banner shows again when the server no longer holds a working token: you revoked it, changed the account password, or Microsoft expired it. Run step 2 again. Running it while connected is harmless: the new sign-in replaces the old one (this is also how you switch accounts).

To take the app's access away, open [account.microsoft.com/privacy/app-access](https://account.microsoft.com/privacy/app-access), find **Meter Reader** and remove it. Within 30 minutes the server notices, drops the token and the banner shows.

The token is stored in the database as Microsoft gave it (the server has to send it back, so it cannot be hashed) and is never logged. Someone with a shell on the server could use it to send mail as you, but never to read your mail (ADR 0002, "What it does not protect against").

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

Opens on `http://localhost:5173/home`. By default the API is mocked (MSW), so the api does not need to run.

To use the real api instead, start it (below), then turn the mocks off in a git-ignored `web/.env.development.local`:

```bash
echo "VITE_USE_MOCKS=false" > .env.development.local
yarn dev
```

The dev server proxies `/api/<path>` to `http://localhost:3000/<path>`, the same prefix strip Caddy does on the server, so the app always calls its own origin. Until ticket #3 replaces it, the starter Items page errors against the real api (there is no `/items` route).

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
cp .env.example .env          # once; .env is git-ignored
yarn install
yarn db:deploy                # applies pending migrations; run again after pulling new ones
yarn dev | yarn pino-pretty   # runs src/server.ts with --watch, logs made readable
```

The api listens on `http://localhost:3000`. `GET /health` and `GET /ready` answer `{"status":"ok"}`; the OpenAPI docs are at `http://localhost:3000/docs`. Every other route needs a session: on a fresh database the api prints a setup link to `http://localhost:5173/setup?code=…` (the web dev server, `APP_ORIGIN` in `api/.env`). Open it with the web app running against the real api (below).

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
| `yarn mail:connect` | Signs the server in to Hotmail (README, Connecting Hotmail)    |

Postgres keeps running until you stop it: `yarn postgres:stop` / `yarn postgres:start` in `api/` (those two scripts are Homebrew only), or your system's service manager.

The tests need the same local Postgres and the `meter` role: each run makes a migrated `meter_test_template` database, gives every test file its own copy, and drops them all at the end (`api/.env.test`).

### Environment files

Each `.env` belongs to the folder that reads it:

| File                   | Read by               | Holds                                                                                                |
| ---------------------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `.env` (repo root)     | `docker compose`      | Compose variables only: `POSTGRES_PASSWORD`, `MICROSOFT_CLIENT_ID`, `PROVIDER_EMAIL`, `MAIL_SUBJECT` |
| `web/.env.development` | `yarn dev` in `web/`  | The `VITE_*` dev values (committed, nothing secret)                                                  |
| `web/.env.example`     | nobody                | Every `VITE_*` key; copy to `.env.development.local`                                                 |
| `api/.env`             | `yarn dev` in `api/`  | The api's settings (copy `api/.env.example`, git-ignored)                                            |
| `api/.env.test`        | `yarn test` in `api/` | The test settings (committed)                                                                        |

`VITE_*` values are built into the bundle at build time, so they are never secrets:

| Variable            | Meaning                                                     |
| ------------------- | ----------------------------------------------------------- |
| `VITE_PROJECT_PATH` | Base path the app is served from (`/` by default)           |
| `VITE_BASE_API_URL` | Base URL for every API call (`/api`, proxied to the api)    |
| `VITE_USE_MOCKS`    | `true` starts MSW in the browser (on in dev, off in builds) |
| `VITE_PLAYWRIGHT`   | `true` under Playwright, which brings its own mocks         |

An older checkout may still have `VITE_*` lines in a root `.env` or `.env.development`. Nothing reads them there any more: move any value you changed to `web/.env.development.local`, and keep only `POSTGRES_PASSWORD` in the root `.env`.

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
