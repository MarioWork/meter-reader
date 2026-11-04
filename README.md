# Meter Reader

Take a photo of your water meter, check the reading, and email it to your water provider from your own Hotmail. One
user, one meter, one provider, on your home server.

A reading is sent exactly as read: every digit, leading zeros kept, red digits included.

## Contents

**Set it up**, in this order:

| Step | Guide | What it covers |
| --- | --- | --- |
| 1 | [Running on the home server](./docs/guide/home-server.md) | Docker, first start, updating, logs, where data lives and what to back up |
| 2 | [Signing in](./docs/guide/sign-in.md) | The one-time setup link, password or passkey, resetting the login |
| 3 | [Connecting Hotmail](./docs/guide/hotmail.md) | The one-time Microsoft setup, click by click, so the app can send email |

**Work on it:**

| Guide | What it covers |
| --- | --- |
| [Local development](./docs/guide/local-development.md) | Running with mocks, running the whole app without mocks, scripts, `.env` files |
| [The web codebase](./docs/guide/web-codebase.md) | Stack, folders, how data flows, theme, adding a feature, lint rules |

**Background:**

| Document | What it covers |
| --- | --- |
| [Glossary](./docs/GLOSSARY.md) | The words this project uses: Reading, Template, Placeholder, Client number… |
| [How it fits together](./docs/flow.md) | The whole flow, as diagrams |
| [Decisions](./docs/adr/) | Why mail goes through Microsoft Graph, why one login, why settings live in the app |
| [Assets](./assets/README.md) | The logo and the drawings, as standalone SVGs |

## Quick start

See the app in 1 minute, with a fake API in the browser:

```bash
cd web
yarn install
yarn dev
```

Then open `http://localhost:5173/home`. To run it for real, with the api and a database, see
[Run the whole app without mocks](./docs/guide/local-development.md#run-the-whole-app-without-mocks).

## How the email is made

The provider's address, your client number and the email's subject and body are set in the app, on the **Settings**
page ([ADR 0003](./docs/adr/0003-email-settings-in-the-app.md)). Until the address is set, Send stays off.

The templates start as `Leitura {date}` and `Leitura - {reading} - {date} - {client}`:

| Placeholder | Becomes |
| --- | --- |
| `{reading}` | The reading, exactly as read |
| `{date}` | Its day, in the date format and language chosen in Settings |
| `{client}` | The client number saved in Settings (empty until one is) |

Nothing else in braces is taken: a typo is refused when you save.
