import { env } from '../../config/env.ts';
import { ConflictError } from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import { settingsRepository, type SettingsRow } from './settings.repository.ts';
import type { SettingsResponse, UpdateSettings } from './settings.schema.ts';
import { DEFAULT_BODY_TEMPLATE, DEFAULT_SUBJECT_TEMPLATE } from './settings.template.ts';
import type { MessageTemplates } from './settings.type.ts';

// For the modules that build an email: they reach the template rules through this service only.
export { fillMessageTemplate } from './settings.template.ts';

const log = logger.child({ module: 'settings' });

// The web app shows this as is, beside the Send it turns off.
const NO_PROVIDER_EMAIL_MESSAGE = "Set the provider's address in Settings.";

// A fresh install's settings, until the user saves them the first time.
const UNSAVED_SETTINGS: SettingsRow = {
  providerEmail: null,
  subjectTemplate: DEFAULT_SUBJECT_TEMPLATE,
  bodyTemplate: DEFAULT_BODY_TEMPLATE,
};

async function findSettings(): Promise<SettingsRow> {
  const row = await settingsRepository.find();

  return row ?? UNSAVED_SETTINGS;
}

function toResponse({ providerEmail, subjectTemplate, bodyTemplate }: SettingsRow): SettingsResponse {
  return { from: env.MAIL_FROM ?? null, to: providerEmail, subjectTemplate, bodyTemplate };
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

// The subject and body every email is filled in from: the saved ones, a fresh install's until then.
export async function getMessageTemplates(): Promise<MessageTemplates> {
  const { subjectTemplate, bodyTemplate } = await findSettings();

  return { subject: subjectTemplate, body: bodyTemplate };
}

export async function getSettings(): Promise<SettingsResponse> {
  return toResponse(await findSettings());
}

export async function updateSettings({ to, subjectTemplate, bodyTemplate }: UpdateSettings): Promise<SettingsResponse> {
  const row = await settingsRepository.save({ providerEmail: to, subjectTemplate, bodyTemplate });

  // Never the values themselves: they are the user's data.
  log.info('settings saved');

  return toResponse(row);
}
