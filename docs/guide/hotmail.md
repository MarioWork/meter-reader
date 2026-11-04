# Connecting Hotmail

The app emails your readings from your own Hotmail. For that, Microsoft has to know about the app, and you have to
let it send mail as you. You do this **once**.

[← Back to the README](../../README.md)

## Contents

- [What you need](#what-you-need)
- [Step 1: Get a free Microsoft directory](#step-1-get-a-free-microsoft-directory)
- [Step 2: Register the app](#step-2-register-the-app)
- [Step 3: Give the server the client ID](#step-3-give-the-server-the-client-id)
- [Step 4: Sign in to Hotmail](#step-4-sign-in-to-hotmail)
- [Sending a reading](#sending-a-reading)
- [When the banner comes back](#when-the-banner-comes-back)
- [Taking the app's access away](#taking-the-apps-access-away)
- [Troubleshooting](#troubleshooting)
- [What the app can and cannot do](#what-the-app-can-and-cannot-do)

## What you need

- The Hotmail (or Outlook.com) account your water provider knows.
- About 15 minutes.
- A bank card for Microsoft's identity check in step 1. The free account does not charge it.

Until all four steps are done, the app shows a **"Hotmail not connected"** banner and Send stays off.

## Step 1: Get a free Microsoft directory

Microsoft only lets you register an app inside a **directory** (Microsoft also calls it a _tenant_). A personal
Hotmail has none until you make one. The free Azure sign-up makes it for you, named **Default Directory**.

1. Go to [azure.microsoft.com/free](https://azure.microsoft.com/free).
2. Sign up with **your Hotmail account**.
3. Finish the sign-up, card check included.

Skip this step if you already have a directory.

> If you see _"Selected user account does not exist in tenant 'Microsoft Services'"_, this step is what is missing.

## Step 2: Register the app

Microsoft moves its buttons around now and then, so a label may look a little different.

**Find the page**

1. Open [portal.azure.com](https://portal.azure.com) and sign in with your Hotmail.
2. In the search bar at the very top, type **App registrations** and open it.
3. Click **+ New registration**.

**Fill the form**

4. **Name:** `Meter Reader`.
5. **Supported account types:** **Personal Microsoft accounts only**. Any other choice fails later.
6. **Redirect URI:** leave it empty.
7. Click **Register**.

**Copy the ID**

8. You land on **Overview**. Copy **Application (client) ID**: a long code like `1234abcd-…`. It is not a secret.

**Turn on sign-in with a code**

9. In the left menu, open **Authentication** (on newer screens, its **Settings** tab).
10. Set **Allow public client flows** to **Yes**, then click **Save**. There is no client secret.

**Give it mail permission**

11. In the left menu, open **API permissions**.
12. Click **+ Add a permission** → **Microsoft Graph** → **Delegated permissions**.
13. Tick `Mail.Send` and `offline_access` (use the search box).
14. Click **Add permissions**. If `User.Read` is listed, remove it.

No admin consent is needed: you approve the permission yourself in step 4.

## Step 3: Give the server the client ID

Put the ID from step 2 in the server's settings, then restart the api.

**On the home server** (the `.env` next to `compose.yaml`):

```bash
echo "MICROSOFT_CLIENT_ID=<the Application (client) ID>" >> .env
docker compose up -d
```

**In local development** (`api/.env`), add the line, then restart `yarn dev`:

```bash
MICROSOFT_CLIENT_ID=<the Application (client) ID>
```

Optional, in the same file: `MAIL_FROM=you@hotmail.com`. The app only shows it as "From".

## Step 4: Sign in to Hotmail

Run the sign-in command.

**On the home server:**

```bash
docker compose exec api node dist/cli/connectMail.js
```

**In local development:**

```bash
cd api && yarn mail:connect
```

It prints a **code** and an **address** (`microsoft.com/link` or `microsoft.com/devicelogin`). Then:

1. Open the address on your phone or laptop.
2. Type the code.
3. Sign in with **the Hotmail your water provider knows**.
4. Accept **"Send mail as you"**.

The command says **"Hotmail connected"** and the banner goes away. The code works for 15 minutes; if it runs out, run
the command again.

From then on the server renews the sign-in by itself, every 30 minutes. Nothing needs doing between readings.

## Sending a reading

1. Set the provider's address (and your client number, if they ask for one) on the **Settings** page. Until the
   address is set, Send stays off.
2. In the history, press **Send** on a reading. It opens the email exactly as it will go out: To, the subject, the
   body and, when there is a photo, an **Attach photo** switch.
3. Press **Send**. The reading shows **"Sent"** with the time.

If Microsoft refuses it, the preview says why, the reading shows **"Failed"**, and **Try again** opens the preview
again.

An email can be at most 4 MB, and the photo grows by a third on the way. A photo over about 2.9 MB cannot be
attached: the app says so first, and the reading can still go without it.

## When the banner comes back

The banner returns when the server's sign-in stops working: you removed the app's access, changed your password, or
Microsoft let it expire. Run [step 4](#step-4-sign-in-to-hotmail) again.

Running step 4 while connected is harmless: the new sign-in replaces the old one. This is also how you switch to
another Hotmail.

## Taking the app's access away

Open [account.microsoft.com/privacy/app-access](https://account.microsoft.com/privacy/app-access), find
**Meter Reader** and remove it. Within 30 minutes the server notices and the banner shows.

## Troubleshooting

| You see | What to do |
| --- | --- |
| _"Selected user account does not exist in tenant…"_ | Do [step 1](#step-1-get-a-free-microsoft-directory). Or a different account is signed in: try a private window. |
| _"MICROSOFT_CLIENT_ID is not set"_ | Do [step 3](#step-3-give-the-server-the-client-id), then restart the api. |
| _"Microsoft refused the sign-in"_ | Check step 2: **Personal Microsoft accounts only**, and **Allow public client flows** on **Yes**. |
| The code ran out | Run step 4 again. Each code works for 15 minutes. |
| Send stays off | Connect Hotmail, and set the provider's address in Settings. |

## What the app can and cannot do

- It asks for one mail permission, `Mail.Send` (plus `offline_access`, so the sign-in can renew itself). It can
  **send** mail as you, but never read, list or delete it.
- The sign-in token is stored in the database as Microsoft gave it (the server must send it back, so it cannot be
  hashed) and is never logged. Someone with a shell on the server could send mail as you with it, but never read your
  mail ([ADR 0002](../adr/0002-one-user-login.md), "What it does not protect against").
- Why Microsoft Graph and not plain SMTP: [ADR 0001](../adr/0001-send-mail-through-microsoft-graph.md).
