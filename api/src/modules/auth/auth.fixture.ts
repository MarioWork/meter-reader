// Test helpers for the one-user login: a clean slate, a set-up app, and the session cookie of an answer.
import type { LightMyRequestResponse } from 'fastify';
import type { App } from '../../app.ts';
import { prisma } from '../../lib/prisma.ts';
import { SESSION_COOKIE_NAME } from '../../lib/sessionCookie.ts';
import type { RegistrationOptionsResponse } from './auth.schema.ts';
import { addSetupCode } from './setup/setup.service.ts';
import type { TestPasskey } from './TestPasskey.ts';

export const TEST_PASSWORD = 'the meter lives under the stairs';

const ADDRESSES_PER_BLOCK = 250;
let addressCounter = 0;

// The rate limits count per address: each call speaks from its own unless a test says otherwise.
export function nextAddress(): string {
  addressCounter += 1;

  return `10.9.${Math.floor(addressCounter / ADDRESSES_PER_BLOCK)}.${addressCounter % ADDRESSES_PER_BLOCK}`;
}

// Every login table emptied: the app is back to "not set up". Each test file has its own database.
export async function resetAuthTables(): Promise<void> {
  await prisma.$transaction([
    prisma.session.deleteMany(),
    prisma.passkey.deleteMany(),
    prisma.account.deleteMany(),
    prisma.authChallenge.deleteMany(),
    prisma.setupCode.deleteMany(),
  ]);
}

// The session token an answer set, or '' when it set none.
export function sessionTokenOf(response: LightMyRequestResponse): string {
  const cookie = response.cookies.find((candidate) => candidate.name === SESSION_COOKIE_NAME);

  return cookie?.value ?? '';
}

export function withSession(token: string) {
  return { cookies: { [SESSION_COOKIE_NAME]: token } };
}

// A new setup code, as the server prints it on start.
export async function newSetupCode(): Promise<string> {
  const code = await addSetupCode();

  if (!code) throw new Error('The app is already set up');

  return code;
}

// Sets the app up with a password; returns the session token setup signed in with.
export async function setUpWithPassword(app: App, password = TEST_PASSWORD): Promise<string> {
  const code = await newSetupCode();
  const response = await app.inject({
    method: 'POST',
    url: '/auth/setup',
    remoteAddress: nextAddress(),
    payload: { code, password },
  });

  return sessionTokenOf(response);
}

// The browser's half of a passkey setup: ask for options with the code, then let the passkey answer them.
export async function registerPasskey(app: App, code: string, passkey: TestPasskey) {
  const options = await app.inject({
    method: 'POST',
    url: '/auth/setup/options',
    remoteAddress: nextAddress(),
    payload: { code },
  });

  return passkey.register(options.json<RegistrationOptionsResponse>());
}

// Sets the app up with a passkey only; returns the session token setup signed in with.
export async function setUpWithPasskey(app: App, passkey: TestPasskey): Promise<string> {
  const code = await newSetupCode();
  const registration = await registerPasskey(app, code, passkey);
  const response = await app.inject({
    method: 'POST',
    url: '/auth/setup',
    remoteAddress: nextAddress(),
    payload: { code, passkey: registration },
  });

  return sessionTokenOf(response);
}
