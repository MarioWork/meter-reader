# Send mail from the user's Hotmail through Microsoft Graph

## Context

The app emails each reading to the provider. The provider knows the user by their Hotmail address, so the mail has to come from that account, not from a new one. Microsoft is removing basic auth and app passwords for Outlook.com SMTP, so a stored password will stop working.

## Decision

Mail goes out through the Microsoft Graph `sendMail` call, signed in once as the user with OAuth (`mail:connect`). The app asks for one mail permission only, `Mail.Send` (plus `offline_access`, so the token can renew itself). It cannot read, list or delete mail. The token lives on the server, and the user can revoke it at any time from their Microsoft account.

Graph takes at most 3 MB of attachments in one `sendMail` call. A bigger file needs an upload session, which needs a draft and so `Mail.ReadWrite`. To stay send-only, the app shrinks every photo below that limit before it sends it.

The provider's address, the subject and the mail settings live in the server `.env`. For now the subject is `test` and the body is the date plus the reading.

## Considered Options

- **Outlook.com SMTP with the account password or an app password**: rejected, Microsoft is turning both off.
- **SMTP with OAuth (XOAUTH2)**: rejected, it needs the `SMTP.Send` scope and a hand-built OAuth flow over SMTP, for no gain over Graph.
- **A Gmail account (SMTP or the Gmail API)**: rejected, the mail would come from an address the provider does not know.
- **Upload sessions for full-size photos**: rejected, they need `Mail.ReadWrite`, which lets the app read the whole mailbox.
