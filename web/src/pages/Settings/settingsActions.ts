import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import settingsService from '@services/settingsService/settingsService';
import { UpdateSettingsSchema } from '@services/settingsService/settingsService.type';
import type { SettingsApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import { parseFormData } from '@utils/formDataUtils';
import { toastOnSuccess } from '@utils/toastUtils';
import type { SettingsFormData } from './settingsUtils';

const SAVED_MESSAGE = 'Settings saved';

// The page stays open once saved: its loader runs again, and a toast says it went through.
export async function updateSettingsAction({
  request,
}: ActionFunctionArgs): Promise<JSONResponseUtil<SettingsApiModel>> {
  const { settings } = parseFormData<SettingsFormData>(await request.formData());

  try {
    const validSettings = await UpdateSettingsSchema.validate(settings);
    const result = await settingsService.updateSettings(validSettings);

    return toastOnSuccess(result, SAVED_MESSAGE);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
}
