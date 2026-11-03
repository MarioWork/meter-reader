// The mock settings: one row shared by the handlers, so an address and templates saved in the demo are the ones the
// emails go out with.
import type { SettingsApiModel } from '@app-types/models';
import { createSettingsMockModel } from './models/settingsMockModel.mock';

// What can be saved, as on the API: "From" is not the app's to change. A null `to` clears the address, for a test of
// the empty state.
type MockSettingsChanges = Partial<Omit<SettingsApiModel, 'from'>>;

let settings: SettingsApiModel = createSettingsMockModel();

export function getMockSettings(): SettingsApiModel {
  return settings;
}

export function updateMockSettings(changes: MockSettingsChanges): SettingsApiModel {
  settings = { ...settings, ...changes };

  return settings;
}

// Between tests: back to the saved settings.
export function resetMockSettings(): void {
  settings = createSettingsMockModel();
}
