// Every table the one-user login keeps: the account, its passkeys, the sessions, passkey challenges and setup codes.
import type { AuthChallengePurpose, Prisma, SignInMethod } from '../../generated/prisma/client.ts';
import { prisma } from '../../lib/prisma.ts';

const ID_SELECT = { id: true } as const;

const PASSKEY_SELECT = {
  id: true,
  credentialId: true,
  publicKey: true,
  counter: true,
  transports: true,
  account: { select: { webauthnUserId: true } },
} as const satisfies Prisma.PasskeySelect;

const SESSION_SELECT = { tokenHash: true, signedInAt: true, lastSeenAt: true } as const satisfies Prisma.SessionSelect;

const PASSWORD_SELECT = { passwordHash: true } as const satisfies Prisma.AccountSelect;

const CHALLENGE_SELECT = { challenge: true, webauthnUserId: true } as const satisfies Prisma.AuthChallengeSelect;

type NewChallenge = {
  challenge: string;
  purpose: AuthChallengePurpose;
  webauthnUserId: string | null;
  expiresAt: Date;
};

export type NewSession = {
  tokenHash: string;
  signInMethod: SignInMethod;
  signedInAt: Date;
  lastSeenAt: Date;
};

export type NewPasskey = {
  credentialId: string;
  publicKey: Uint8Array<ArrayBuffer>;
  counter: number;
  transports: string[];
  isSynced: boolean;
};

type CompletedSetup = {
  webauthnUserId: string;
  passwordHash: string | null;
  passkey: NewPasskey | null;
  session: NewSession;
};

type PasskeyUse = { counter: number; isSynced: boolean; lastUsedAt: Date };

type CompletedPasskeySignIn = { passkeyId: number; passkeyUse: PasskeyUse; session: NewSession };

type ExecutorClient = typeof prisma | Prisma.TransactionClient;

// Set up means there is a way in: a password or at least one passkey. An account row alone is not enough, since
// yarn auth:reset keeps it and only takes the ways in away.
async function countSignInMethods(executor: ExecutorClient = prisma): Promise<number> {
  const [passwords, passkeys] = await Promise.all([
    executor.account.count({ where: { passwordHash: { not: null } } }),
    executor.passkey.count(),
  ]);

  return passwords + passkeys;
}

async function findPasskey(credentialId: string) {
  return (await prisma.passkey.findUnique({ where: { credentialId }, select: PASSKEY_SELECT })) ?? undefined;
}

async function findSession(tokenHash: string) {
  return (await prisma.session.findUnique({ where: { tokenHash }, select: SESSION_SELECT })) ?? undefined;
}

export type PasskeyRow = NonNullable<Awaited<ReturnType<typeof findPasskey>>>;
export type SessionRow = NonNullable<Awaited<ReturnType<typeof findSession>>>;
export type TakenChallenge = { challenge: string; webauthnUserId: string | null };
export type { AuthChallengePurpose };

export const authRepository = {
  isSetUp: async (): Promise<boolean> => (await countSignInMethods()) > 0,

  // The one account's password hash, or undefined when there is no password (or no account yet).
  findPasswordHash: async (): Promise<string | undefined> => {
    const account = await prisma.account.findFirst({ orderBy: { id: 'asc' }, select: PASSWORD_SELECT });

    return account?.passwordHash ?? undefined;
  },

  findPasskey,

  hasSetupCode: async (codeHash: string): Promise<boolean> => {
    const row = await prisma.setupCode.findUnique({ where: { codeHash }, select: ID_SELECT });

    return row !== null;
  },

  // Only one setup code is ever valid: a new one replaces the old.
  replaceSetupCode: async (codeHash: string): Promise<void> => {
    await prisma.$transaction([
      prisma.setupCode.deleteMany(),
      prisma.setupCode.create({ data: { codeHash }, select: ID_SELECT }),
    ]);
  },

  // Expired challenges are swept whenever a new one is made, so the table stays a handful of rows.
  createChallenge: async (data: NewChallenge): Promise<void> => {
    await prisma.$transaction([
      prisma.authChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
      prisma.authChallenge.create({ data, select: ID_SELECT }),
    ]);
  },

  // Single use: only an unexpired one of the right purpose counts, and only the caller whose delete removed the row
  // gets it back, so two requests racing with the same challenge cannot both use it.
  takeChallenge: (challenge: string, purpose: AuthChallengePurpose): Promise<TakenChallenge | undefined> =>
    prisma.$transaction(async (transaction) => {
      const where = { challenge, purpose, expiresAt: { gt: new Date() } };
      const found = await transaction.authChallenge.findFirst({ where, select: CHALLENGE_SELECT });

      if (!found) return undefined;

      const { count } = await transaction.authChallenge.deleteMany({ where });

      return count === 0 ? undefined : found;
    }),

  // Setup, all or nothing: the password and/or first passkey, the first session, and the setup code gone. After yarn
  // auth:reset the account row is still there and gets its ways in back, instead of a second account.
  // Returns false when another setup finished first (counted inside the transaction).
  completeSetup: (setup: CompletedSetup): Promise<boolean> =>
    prisma.$transaction(async (transaction) => {
      // Two setups racing would both count 0 under Postgres's default isolation. The lock makes the second wait for
      // the first to commit, then it counts 1 and stops. It ends with the transaction.
      await transaction.$executeRaw`lock table accounts, passkeys in share row exclusive mode`;

      const isAlreadySetUp = (await countSignInMethods(transaction)) > 0;

      if (isAlreadySetUp) return false;

      const accountData = { webauthnUserId: setup.webauthnUserId, passwordHash: setup.passwordHash };
      const existing = await transaction.account.findFirst({ orderBy: { id: 'asc' }, select: ID_SELECT });
      const account = existing
        ? await transaction.account.update({ where: { id: existing.id }, data: accountData, select: ID_SELECT })
        : await transaction.account.create({ data: accountData, select: ID_SELECT });

      if (setup.passkey) {
        await transaction.passkey.create({ data: { ...setup.passkey, accountId: account.id }, select: ID_SELECT });
      }

      await transaction.session.create({ data: setup.session, select: ID_SELECT });
      await transaction.setupCode.deleteMany();

      return true;
    }),

  // yarn auth:reset: every way in goes (sessions, passkeys, the password, challenges, the old setup code) and the new
  // setup code comes in; the account row and every reading stay. All or nothing, so a reset that fails halfway never
  // leaves an old way in alive.
  resetSignIns: async (codeHash: string): Promise<void> => {
    await prisma.$transaction([
      prisma.session.deleteMany(),
      prisma.passkey.deleteMany(),
      prisma.account.updateMany({ data: { passwordHash: null } }),
      prisma.authChallenge.deleteMany(),
      prisma.setupCode.deleteMany(),
      prisma.setupCode.create({ data: { codeHash }, select: ID_SELECT }),
    ]);
  },

  createSession: async (session: NewSession): Promise<void> => {
    await prisma.session.create({ data: session, select: ID_SELECT });
  },

  // A passkey sign-in: the passkey's new counter and the new session together.
  completePasskeySignIn: async ({ passkeyId, passkeyUse, session }: CompletedPasskeySignIn): Promise<void> => {
    await prisma.$transaction([
      prisma.passkey.update({ where: { id: passkeyId }, data: passkeyUse, select: ID_SELECT }),
      prisma.session.create({ data: session, select: ID_SELECT }),
    ]);
  },

  findSession,

  touchSession: async (tokenHash: string, lastSeenAt: Date): Promise<void> => {
    await prisma.session.updateMany({ where: { tokenHash }, data: { lastSeenAt } });
  },

  deleteSession: async (tokenHash: string): Promise<void> => {
    await prisma.session.deleteMany({ where: { tokenHash } });
  },

  // Sessions past either timeout; swept on each sign-in so old rows never pile up.
  deleteExpiredSessions: async (signedInBefore: Date, lastSeenBefore: Date): Promise<void> => {
    await prisma.session.deleteMany({
      where: { OR: [{ signedInAt: { lt: signedInBefore } }, { lastSeenAt: { lt: lastSeenBefore } }] },
    });
  },
};
