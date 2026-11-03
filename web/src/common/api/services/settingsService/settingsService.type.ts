import { object, type InferType } from 'yup';
import { messageDateFormatSchema } from '@utils/messageDateFormatUtils';
import { providerEmailSchema } from '@utils/emailUtils';
import { bodyTemplateSchema, subjectTemplateSchema } from '@utils/messageTemplateUtils';

// What the Settings page saves, all of it at once. "From" is not in it: it is the connected Microsoft account, never
// the app's to change.
export const UpdateSettingsSchema = object({
  to: providerEmailSchema,
  subjectTemplate: subjectTemplateSchema,
  bodyTemplate: bodyTemplateSchema,
  dateFormat: messageDateFormatSchema,
});

export type UpdateSettings = InferType<typeof UpdateSettingsSchema>;
