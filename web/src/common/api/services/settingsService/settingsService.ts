import axios from 'axios';
import { axiosActions } from '@api/axiosActions';
import type { SettingsApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import type { UpdateSettings } from './settingsService.type';

const BASE_SETTINGS_URL = '/settings';

// The app's one set of settings (ADR 0003).
export default {
  getSettings: async (): Promise<SettingsApiModel> => {
    const response = await axios.get<SettingsApiModel>(BASE_SETTINGS_URL);

    return response.data;
  },

  updateSettings: async (fields: UpdateSettings): Promise<JSONResponseUtil<SettingsApiModel>> =>
    axiosActions<SettingsApiModel>({ url: BASE_SETTINGS_URL, method: HttpVerbsUtil.PUT, data: fields }),
};
