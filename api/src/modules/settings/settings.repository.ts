// The one settings row (ADR 0003). Its id is always 1, so there is never more than one.
import type { Prisma } from '../../generated/prisma/client.ts';
import { prisma } from '../../lib/prisma.ts';

const SETTINGS_ID = 1;

const SETTINGS_SELECT = { providerEmail: true } as const satisfies Prisma.SettingsSelect;

export type SettingsRow = { providerEmail: string | null };

export const settingsRepository = {
  // Undefined until the user saves Settings the first time.
  find: async (): Promise<SettingsRow | undefined> => {
    const row = await prisma.settings.findUnique({ where: { id: SETTINGS_ID }, select: SETTINGS_SELECT });

    return row ?? undefined;
  },

  saveProviderEmail: (providerEmail: string): Promise<SettingsRow> =>
    prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, providerEmail },
      update: { providerEmail },
      select: SETTINGS_SELECT,
    }),
};
