# One-user login: long password and/or passkey

## Context

The app has one user, one meter and one provider. It runs on a home server and is reached over the home network at `https://meter.home.arpa:8443`. Anyone else on that network (guests, other devices) could open it, send readings or look at past ones, unless it asks who you are.

## Decision

There is exactly one account. On first start the server prints a one-time setup link. Opening it lets the user set a password of at least 15 characters, add a passkey, or both. After that the setup link is dead, and the app asks for the password or a passkey.

The password is stored hashed, never as typed. There are no other users, no sign-up, no email reset and no "auth off" switch. If the user is locked out, `auth:reset` on the server wipes the password and passkeys and prints a new setup link.

### What it protects against

People on the network who can reach the app but are not the user.

### What it does not protect against

Someone with a shell on the server. They can read `.env`, the database and the photos, and run `auth:reset`. What they still cannot do: learn the password (it is only stored hashed), or read the user's mail (the Graph token is send-only and the user can revoke it from their Microsoft account, see [ADR 0001](./0001-send-mail-through-microsoft-graph.md)).

## Considered Options

- **No login, trust the home network**: rejected, anyone on the Wi-Fi could send readings in the user's name.
- **Passkey only**: rejected, it locks the user out on a device that has no passkey.
- **Character-mix rules or TOTP**: rejected as overkill for one user on a home network; length (15+, NIST SP 800-63B for a password used alone) is what matters.
- **Email reset link**: rejected, it would need the app to read mail, and anyone locked out of a home server can reach its shell anyway.
