import { env } from '../../config/env.ts';
import { ConflictError } from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import { DEFAULT_MESSAGE_DATE_FORMAT } from './settings.dateFormat.ts';
import { settingsRepository, type SettingsRow } from './settings.repository.ts';
import type { SettingsResponse, UpdateSettings } from './settings.schema.ts';
import { DEFAULT_BODY_TEMPLATE, DEFAULT_SUBJECT_TEMPLATE } from './settings.template.ts';
import { MESSAGE_DATE_FORMATS, type MessageDateFormat, type MessageSettings } from './settings.type.ts';

// For the modules that build an email: they reach the template and date rules through this service only.
export { fillMessageTemplate } from './settings.template.ts';
export { formatMessageDate } from './settings.dateFormat.ts';

const log = logger.child({ module: 'settings' });

// The web app shows this as is, beside the Send it turns off.
const NO_PROVIDER_EMAIL_MESSAGE = "Set the provider's address in Settings.";

const DATE_FORMAT_MAP: Record<SettingsRow['dateFormat'], MessageDateFormat> = {
  LONG_MONTH: MESSAGE_DATE_FORMATS.LONG_MONTH,
  SHORT_MONTH: MESSAGE_DATE_FORMATS.SHORT_MONTH,
  DAY_MONTH_YEAR: MESSAGE_DATE_FORMATS.DAY_MONTH_YEAR,
  ISO: MESSAGE_DATE_FORMATS.ISO,
};

// The other way round, for a save.
const ROW_DATE_FORMAT_MAP: Record<MessageDateFormat, SettingsRow['dateFormat']> = {
  [MESSAGE_DATE_FORMATS.LONG_MONTH]: 'LONG_MONTH',
  [MESSAGE_DATE_FORMATS.SHORT_MONTH]: 'SHORT_MONTH',
  [MESSAGE_DATE_FORMATS.DAY_MONTH_YEAR]: 'DAY_MONTH_YEAR',
  [MESSAGE_DATE_FORMATS.ISO]: 'ISO',
};

// A fresh install's settings, until the user saves them the first time.
const UNSAVED_SETTINGS: SettingsRow = {
  providerEmail: null,
  subjectTemplate: DEFAULT_SUBJECT_TEMPLATE,
  bodyTemplate: DEFAULT_BODY_TEMPLATE,
  dateFormat: ROW_DATE_FORMAT_MAP[DEFAULT_MESSAGE_DATE_FORMAT],
};

async function findSettings(): Promise<SettingsRow> {
  const row = await settingsRepository.find();

  return row ?? UNSAVED_SETTINGS;
}

function toResponse({ providerEmail, subjectTemplate, bodyTemplate, dateFormat }: SettingsRow): SettingsResponse {
  return {
    from: env.MAIL_FROM ?? null,
    to: providerEmail,
    subjectTemplate,
    bodyTemplate,
    dateFormat: DATE_FORMAT_MAP[dateFormat],
  };
}

// The address every reading is emailed to; null until the user saves one in Settings.
export async function getProviderEmail(): Promise<string | null> {
  const { providerEmail } = await findSettings();

  return providerEmail;
}

// For a send: the address, or a 409 that tries nothing when there is none.
export async function requireProviderEmail(): Promise<string> {
  const providerEmail = await getProviderEmail();

  if (!providerEmail) throw new ConflictError(NO_PROVIDER_EMAIL_MESSAGE, 'PROVIDER_EMAIL_NOT_SET');

  return providerEmail;
}

// The subject and body every email is filled in from, and how its {date} is written: the saved ones, a fresh
// install's until then.
export async function getMessageSettings(): Promise<MessageSettings> {
  const { subjectTemplate, bodyTemplate, dateFormat } = await findSettings();

  return { subject: subjectTemplate, body: bodyTemplate, dateFormat: DATE_FORMAT_MAP[dateFormat] };
}

export async function getSettings(): Promise<SettingsResponse> {
  return toResponse(await findSettings());
}

export async function updateSettings({
  to,
  subjectTemplate,
  bodyTemplate,
  dateFormat,
}: UpdateSettings): Promise<SettingsResponse> {
  const row = await settingsRepository.save({
    providerEmail: to,
    subjectTemplate,
    bodyTemplate,
    dateFormat: ROW_DATE_FORMAT_MAP[dateFormat],
  });

  // Never the values themselves: they are the user's data.
  log.info('settings saved');

  return toResponse(row);
}
