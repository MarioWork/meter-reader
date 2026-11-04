import { env } from '../../config/env.ts';
import { ConflictError } from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import { DEFAULT_MESSAGE_DATE_FORMAT, DEFAULT_MESSAGE_DATE_LANGUAGE } from './settings.dateFormat.ts';
import { settingsRepository, type SettingsRow } from './settings.repository.ts';
import type { SettingsResponse, UpdateSettings } from './settings.schema.ts';
import { DEFAULT_BODY_TEMPLATE, DEFAULT_SUBJECT_TEMPLATE } from './settings.template.ts';
import {
  MESSAGE_DATE_FORMATS,
  MESSAGE_DATE_LANGUAGES,
  type MessageDateFormat,
  type MessageDateLanguage,
  type MessageSettings,
} from './settings.type.ts';

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

const DATE_LANGUAGE_MAP: Record<SettingsRow['dateLanguage'], MessageDateLanguage> = {
  ENGLISH: MESSAGE_DATE_LANGUAGES.ENGLISH,
  PORTUGUESE: MESSAGE_DATE_LANGUAGES.PORTUGUESE,
};

const ROW_DATE_LANGUAGE_MAP: Record<MessageDateLanguage, SettingsRow['dateLanguage']> = {
  [MESSAGE_DATE_LANGUAGES.ENGLISH]: 'ENGLISH',
  [MESSAGE_DATE_LANGUAGES.PORTUGUESE]: 'PORTUGUESE',
};

// A fresh install's settings, until the user saves them the first time.
const UNSAVED_SETTINGS: SettingsRow = {
  providerEmail: null,
  clientNumber: null,
  subjectTemplate: DEFAULT_SUBJECT_TEMPLATE,
  bodyTemplate: DEFAULT_BODY_TEMPLATE,
  dateFormat: ROW_DATE_FORMAT_MAP[DEFAULT_MESSAGE_DATE_FORMAT],
  dateLanguage: ROW_DATE_LANGUAGE_MAP[DEFAULT_MESSAGE_DATE_LANGUAGE],
};

async function findSettings(): Promise<SettingsRow> {
  const row = await settingsRepository.find();

  return row ?? UNSAVED_SETTINGS;
}

function toResponse({
  providerEmail,
  clientNumber,
  subjectTemplate,
  bodyTemplate,
  dateFormat,
  dateLanguage,
}: SettingsRow): SettingsResponse {
  return {
    from: env.MAIL_FROM ?? null,
    to: providerEmail,
    clientNumber,
    subjectTemplate,
    bodyTemplate,
    dateFormat: DATE_FORMAT_MAP[dateFormat],
    dateLanguage: DATE_LANGUAGE_MAP[dateLanguage],
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

// The subject and body every email is filled in from, how its {date} is written, and its {client}: the saved ones, a
// fresh install's until then.
export async function getMessageSettings(): Promise<MessageSettings> {
  const { subjectTemplate, bodyTemplate, dateFormat, dateLanguage, clientNumber } = await findSettings();

  return {
    subject: subjectTemplate,
    body: bodyTemplate,
    dateFormat: DATE_FORMAT_MAP[dateFormat],
    dateLanguage: DATE_LANGUAGE_MAP[dateLanguage],
    clientNumber,
  };
}

export async function getSettings(): Promise<SettingsResponse> {
  return toResponse(await findSettings());
}

export async function updateSettings({
  to,
  clientNumber,
  subjectTemplate,
  bodyTemplate,
  dateFormat,
  dateLanguage = DEFAULT_MESSAGE_DATE_LANGUAGE,
}: UpdateSettings): Promise<SettingsResponse> {
  const row = await settingsRepository.save({
    providerEmail: to,
    // An empty one is not set.
    clientNumber: clientNumber || null,
    subjectTemplate,
    bodyTemplate,
    dateFormat: ROW_DATE_FORMAT_MAP[dateFormat],
    dateLanguage: ROW_DATE_LANGUAGE_MAP[dateLanguage],
  });

  // Never the values themselves: they are the user's data.
  log.info('settings saved');

  return toResponse(row);
}
