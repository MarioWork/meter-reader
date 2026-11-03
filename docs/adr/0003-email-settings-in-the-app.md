# Email settings live in the app, not in `.env`

## Context

[ADR 0001](./0001-send-mail-through-microsoft-graph.md) put the provider's address, the subject and the rest of the mail settings in the server `.env`. Changing any of them means a shell on the server, an edit and a restart. The user has no shell on their phone, and these are things they need to change: a new provider address, the subject the provider asks for, the way the date is written.

## Decision

The provider's address, the subject, the body and the date format move from `.env` into one settings row in the database. The user changes them on the app's **Settings** page. There is one user ([ADR 0002](./0002-one-user-login.md)), so the page needs nothing beyond being signed in.

- The row is made the first time the user saves Settings. There is never more than one.
- The provider's address has no default. Until it is saved, Send is off in the app, and the server refuses a send.
- A reading already sent keeps the email it went out with (its saved `sent*` copy). Changing a setting never rewrites the history.
- They move one at a time: the provider's address first (`PROVIDER_EMAIL` is gone from `.env`), then the subject and body, then the date format.

**From** does not move. Microsoft sends from whichever account `yarn mail:connect` signed in with, so changing "From" still means connecting another account. `MAIL_FROM` stays in `.env` as the label the app shows; Settings shows it, read-only.

This replaces the line in ADR 0001 that says the provider's address, the subject and the mail settings live in the server `.env`.

## Considered Options

- **Keep them in `.env`**: rejected, the user cannot change them without a shell on the server.
- **An editable "From"**: rejected, it would only change a label. The mail still goes out from the connected account, so the app would show an address it does not send from.
