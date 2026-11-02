// The one Hotmail connection (ADR 0001): the tokens the server sends mail with.
import type { Prisma } from '../../generated/prisma/client.ts';
import { prisma } from '../../lib/prisma.ts';

const ID_SELECT = { id: true } as const;

const CONNECTION_SELECT = {
  refreshToken: true,
  accessToken: true,
  accessTokenExpiresAt: true,
} as const satisfies Prisma.MailConnectionSelect;

export type MailConnection = {
  refreshToken: string;
  accessToken: string;
  accessTokenExpiresAt: Date;
};

export const mailRepository = {
  hasConnection: async (): Promise<boolean> => (await prisma.mailConnection.count()) > 0,

  findConnection: async (): Promise<MailConnection | undefined> => {
    const connection = await prisma.mailConnection.findFirst({ orderBy: { id: 'asc' }, select: CONNECTION_SELECT });

    return connection ?? undefined;
  },

  // yarn mail:connect: the new connection replaces any old one, all or nothing, so there is never more than one.
  replaceConnection: async (connection: MailConnection): Promise<void> => {
    await prisma.$transaction([
      prisma.mailConnection.deleteMany(),
      prisma.mailConnection.create({ data: connection, select: ID_SELECT }),
    ]);
  },

  // A refresh saves its tokens only over the connection it started from: if yarn mail:connect replaced that one
  // meanwhile, the newer connection stays as it is.
  updateConnection: async (previousRefreshToken: string, connection: MailConnection): Promise<void> => {
    await prisma.mailConnection.updateMany({ where: { refreshToken: previousRefreshToken }, data: connection });
  },

  // Same rule: only the connection Microsoft refused goes, never one connected since.
  deleteConnection: async (refreshToken: string): Promise<void> => {
    await prisma.mailConnection.deleteMany({ where: { refreshToken } });
  },
};
