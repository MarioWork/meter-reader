import getSettingsHandler from './getSettings.mock.handler';
import updateSettingsHandler from './updateSettings.mock.handler';

export const settingsMockHandlers = (baseUrl: string) => [
  ...getSettingsHandler(baseUrl),
  ...updateSettingsHandler(baseUrl),
];
