# Signing in

The app has one login ([ADR 0002](../adr/0002-one-user-login.md)). Every page except the login and setup pages, and
every api route except `/health` and `/ready`, needs it.

[← Back to the README](../../README.md)

## Contents

- [First sign-in](#first-sign-in)
- [Signing in after that](#signing-in-after-that)
- [Resetting the login](#resetting-the-login)

## First sign-in

1. **Find the setup link.** While nobody has set up the app, every api start prints a one-time setup link in the log.

   On the home server:

   ```bash
   docker compose logs api | grep "/setup?code="
   ```

   In local development it is in the `yarn dev` output of `api/`.

   It looks like `https://meter.home.arpa:8443/setup?code=…`. Each restart prints a new one, and the old one stops
   working.

2. **Open the link** on your phone or laptop, and choose how you sign in:
   - a **password** of at least 15 characters (a few words in a row works well; very common passwords are refused),
   - a **passkey** on this device (Face ID, Touch ID or a passkey manager), or
   - **both**.
3. **Press Finish setup.** You are signed in, and the setup link stops working.

## Signing in after that

The login page offers the password and the passkey.

- Five wrong passwords in a minute from one device get "too many tries". Wait a minute and try again. There is no
  lockout.
- A passkey belongs to the address it was made on (`meter.home.arpa`). Always open the app by that name, never by IP
  address, or the passkey will not work.

## Resetting the login

Forgot the password and lost the passkey? Reset the login on the server. It removes the password, every passkey and
every session, then prints a new setup link. Readings, photos, bills and settings are kept.

On the home server:

```bash
docker compose exec api node dist/cli/resetAuth.js
```

In local development:

```bash
cd api && yarn auth:reset
```

Open the printed link and set up the login again, as in [First sign-in](#first-sign-in). Anyone who can run this
already has a shell on the server, so it needs no password.
