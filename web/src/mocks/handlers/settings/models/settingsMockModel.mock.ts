import type { SettingsApiModel } from '@app-types/models';

// MAIL_FROM in api/.env.example, and an address already saved, so dev, the demo and the tests can send straight away.
const MOCK_FROM_EMAIL = 'me@hotmail.example';
export const MOCK_PROVIDER_EMAIL = 'readings@water-provider.example';

export const createSettingsMockModel = (overrides?: Partial<SettingsApiModel>): SettingsApiModel => ({
  from: MOCK_FROM_EMAIL,
  to: MOCK_PROVIDER_EMAIL,
  ...overrides,
});
