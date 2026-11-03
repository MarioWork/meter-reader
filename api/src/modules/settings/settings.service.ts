import { env } from '../../config/env.ts';
import { ConflictError } from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import { settingsRepository } from './settings.repository.ts';
import type { SettingsResponse, UpdateSettings } from './settings.schema.ts';

const log = logger.child({ module: 'settings' });

// The web app shows this as is, beside the Send it turns off.
const NO_PROVIDER_EMAIL_MESSAGE = "Set the provider's address in Settings.";

function toResponse(providerEmail: string | null): SettingsResponse {
  return { from: env.MAIL_FROM ?? null, to: providerEmail };
}

// The address every reading is emailed to; null until the user saves one in Settings.
export async function getProviderEmail(): Promise<string | null> {
  const row = await settingsRepository.find();

  return row?.providerEmail ?? null;
}

// For a send: the address, or a 409 that tries nothing when there is none.
export async function requireProviderEmail(): Promise<string> {
  const providerEmail = await getProviderEmail();

  if (!providerEmail) throw new ConflictError(NO_PROVIDER_EMAIL_MESSAGE, 'PROVIDER_EMAIL_NOT_SET');

  return providerEmail;
}

export async function getSettings(): Promise<SettingsResponse> {
  return toResponse(await getProviderEmail());
}

export async function updateSettings({ to }: UpdateSettings): Promise<SettingsResponse> {
  const row = await settingsRepository.saveProviderEmail(to);

  // Never the address itself: it is the user's data.
  log.info('settings saved');

  return toResponse(row.providerEmail);
}
