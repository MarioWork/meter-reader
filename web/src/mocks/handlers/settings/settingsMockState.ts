// The mock settings: one row shared by the handlers, so an address saved in the demo is the one the emails go to.
import type { SettingsApiModel } from '@app-types/models';
import { createSettingsMockModel } from './models/settingsMockModel.mock';

let settings: SettingsApiModel = createSettingsMockModel();

export function getMockSettings(): SettingsApiModel {
  return settings;
}

// The address only, as on the API: "From" is not the app's to change. Null clears it, for a test of the empty state.
export function setMockProviderEmail(to: string | null): SettingsApiModel {
  settings = { ...settings, to };

  return settings;
}

// Between tests: back to the saved address.
export function resetMockSettings(): void {
  settings = createSettingsMockModel();
}
