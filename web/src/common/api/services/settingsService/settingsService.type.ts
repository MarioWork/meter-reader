import { object, type InferType } from 'yup';
import { messageDateFormatSchema, messageDateLanguageSchema } from '@utils/messageDateFormatUtils';
import { clientNumberSchema, providerEmailSchema } from '@utils/emailUtils';
import { bodyTemplateSchema, subjectTemplateSchema } from '@utils/messageTemplateUtils';

// What the Settings page saves, all of it at once. "From" is not in it: it is the connected Microsoft account, never
// the app's to change.
export const UpdateSettingsSchema = object({
  to: providerEmailSchema,
  clientNumber: clientNumberSchema,
  subjectTemplate: subjectTemplateSchema,
  bodyTemplate: bodyTemplateSchema,
  dateFormat: messageDateFormatSchema,
  dateLanguage: messageDateLanguageSchema,
});

export type UpdateSettings = InferType<typeof UpdateSettingsSchema>;
