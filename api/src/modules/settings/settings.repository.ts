// The one settings row (ADR 0003). Its id is always 1, so there is never more than one.
import type { Prisma } from '../../generated/prisma/client.ts';
import { prisma } from '../../lib/prisma.ts';

const SETTINGS_ID = 1;

const SETTINGS_SELECT = {
  providerEmail: true,
  clientNumber: true,
  subjectTemplate: true,
  bodyTemplate: true,
  dateFormat: true,
  dateLanguage: true,
} as const satisfies Prisma.SettingsSelect;

export type SettingsRow = Prisma.SettingsGetPayload<{ select: typeof SETTINGS_SELECT }>;

// What a save writes: every field the Settings page has.
export type SettingsColumns = Omit<SettingsRow, 'providerEmail'> & { providerEmail: string };

export const settingsRepository = {
  // Undefined until the user saves Settings the first time.
  find: async (): Promise<SettingsRow | undefined> => {
    const row = await prisma.settings.findUnique({ where: { id: SETTINGS_ID }, select: SETTINGS_SELECT });

    return row ?? undefined;
  },

  save: (columns: SettingsColumns): Promise<SettingsRow> =>
    prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...columns },
      update: columns,
      select: SETTINGS_SELECT,
    }),
};
