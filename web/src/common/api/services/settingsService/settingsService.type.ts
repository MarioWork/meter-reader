import { object, type InferType } from 'yup';
import { providerEmailSchema } from '@utils/emailUtils';

// What the Settings page saves. "From" is not in it: it is the connected Microsoft account, never the app's to change.
export const UpdateSettingsSchema = object({
  to: providerEmailSchema,
});

export type UpdateSettings = InferType<typeof UpdateSettingsSchema>;
