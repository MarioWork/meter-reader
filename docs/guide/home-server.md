# Running on the home server

The app runs with Docker on the home server, at `https://meter.home.arpa:8443`. Ports 80 and 443 are left to
other services on the same machine, so this app never uses them.

[← Back to the README](../../README.md)

## Contents

- [What runs](#what-runs)
- [First time](#first-time)
- [Updating](#updating)
- [Logs](#logs)
- [Where data lives](#where-data-lives)
- [Backing up](#backing-up)
- [Restoring](#restoring)

## What runs

`compose.yaml` runs four containers:

| Service   | Does                                                                           |
| --------- | ------------------------------------------------------------------------------ |
| `web`     | Caddy: serves the built app over HTTPS on 8443 and proxies `/api/*` to the api |
| `migrate` | Runs once per `up`: applies pending database migrations, then exits            |
| `api`     | The Fastify API on port 3000, reachable only through Caddy                     |
| `db`      | Postgres 18, reachable only by `migrate` and `api`                             |

## First time

1. **Make the name work on every device.** Add a DNS entry on the router, or a line in each device's hosts file,
   pointing `meter.home.arpa` at the server's LAN address.
2. **Make the settings file.** Copy `.env.example` to `.env` next to `compose.yaml` and set `POSTGRES_PASSWORD`
   (letters and digits only: it goes inside a database URL). `.env` is never committed.
3. **Make the uploads folder**, owned by the api container's user (uid 1000). Without it the api stops at start with
   "The uploads folder … is not writable":

   ```bash
   mkdir -p data/uploads && sudo chown 1000:1000 data/uploads
   ```

4. **Start everything:**

   ```bash
   docker compose up -d --build
   ```

5. **Check it.** This answers `{"status":"ok"}` once the database is up:

   ```bash
   curl -k https://meter.home.arpa:8443/api/ready
   ```

6. **Trust the certificate on each device.** Caddy uses its own local certificate authority (`tls internal`). HTTPS
   is needed for the camera and for installing the app. Copy the certificate off the server, then install it as a
   trusted root on the phone or laptop:

   ```bash
   docker compose cp web:/data/caddy/pki/authorities/local/root.crt ./meter-reader-root.crt
   ```

Next: [sign in for the first time](./sign-in.md), then [connect Hotmail](./hotmail.md).

## Updating

```bash
git pull
docker compose up -d --build
```

The `migrate` service applies any new migrations before the api starts.

> From an older version: `PROVIDER_EMAIL` and `MAIL_SUBJECT` are no longer read from `.env`
> ([ADR 0003](../adr/0003-email-settings-in-the-app.md)). Set the provider's address and the templates on the
> Settings page, then remove those lines from `.env`.

## Logs

```bash
docker compose logs -f api
```

Or `web`, `db`, `migrate` in place of `api`.

## Where data lives

Everything worth backing up is in `./data`, next to `compose.yaml`:

| Folder           | Holds                                                                                |
| ---------------- | ------------------------------------------------------------------------------------ |
| `./data/postgres` | The database: readings, settings, the login and the Hotmail sign-in               |
| `./data/uploads`  | The photos and bills, in one flat folder (`UPLOADS_DIR`)                          |

- The server names every file itself, with a random ID: `<id>.jpg` for a photo, `<id>.pdf`, `.jpg` or `.png`
  for a bill. The name a bill had on your device is kept in the database, for the app to show.
- The database's `photos` and `bills` tables say which file belongs to which reading. Deleting a reading deletes its
  rows and its files.
- Caddy's certificate authority lives in the `caddy_data` volume. Keep it, or every device has to trust a new
  certificate.

Settings → Data can also export every reading as JSON or CSV, and the photos and bills as a zip.

## Backing up

A backup is `./data`, plus two small things beside it. Run every command from the project folder on the server.

**Option 1: stop, copy, start** (simplest). Postgres must be stopped while its folder is copied, or the copy can come
out broken.

```bash
docker compose stop
mkdir -p ~/backups
sudo cp -a data ~/backups/meter-reader-$(date +%F)
docker compose start
```

`sudo`, because the database's files belong to the Postgres container's own user. `cp -a` keeps every owner and
permission as it was: `data/uploads` must stay owned by uid 1000, the api container's user.

**Option 2: without stopping.** Copy the files, and export the database with Postgres's own tool:

```bash
mkdir -p ~/backups/meter-reader-$(date +%F)
cp -a data/uploads ~/backups/meter-reader-$(date +%F)/
docker compose exec -T db pg_dump -U meter -d meter > ~/backups/meter-reader-$(date +%F)/database.sql
```

**Keep these too:**

| What | Why |
| --- | --- |
| `.env` next to `compose.yaml` | The database password and the Microsoft client ID |
| The `caddy_data` volume | Caddy's certificate authority: without it, every device has to trust a new certificate |

To copy `caddy_data`:

```bash
docker run --rm -v meter-reader_caddy_data:/from -v ~/backups:/to alpine \
  tar czf /to/meter-reader-caddy-$(date +%F).tar.gz -C /from .
```

The volume's full name starts with the project folder's name; `docker volume ls | grep caddy_data` shows it.

Keep at least one copy off the server (a USB disk, another machine), so a dead disk does not take the backup with it.

## Restoring

**From option 1** (a copy of `data`):

```bash
docker compose down
rm -rf data
sudo cp -a ~/backups/meter-reader-<date> data
docker compose up -d
```

**From option 2** (uploads and `database.sql`), on a fresh `./data`:

```bash
docker compose down
rm -rf data
mkdir -p data
cp -a ~/backups/meter-reader-<date>/uploads data/uploads
sudo chown -R 1000:1000 data/uploads
docker compose up -d db          # only the database: the app's tables come from the backup, not from migrate
until docker compose exec db pg_isready -U meter; do sleep 1; done
docker compose exec -T db psql -U meter -d meter < ~/backups/meter-reader-<date>/database.sql
docker compose up -d
```

Put `.env` back next to `compose.yaml` before starting. Restore `caddy_data` the same way it was copied, with `tar xzf`
into the volume, to keep the old certificate.
