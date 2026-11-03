import type { UpdateSettings } from '@services/settingsService/settingsService.type';

export type SettingsFormData = { settings: UpdateSettings };

export const SAVE_FAILED_MESSAGE = 'The settings were not saved. Please try again.';
