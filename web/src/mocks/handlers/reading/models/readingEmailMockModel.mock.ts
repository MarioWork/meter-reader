import type { EmailDefaultsApiModel, ReadingApiModel, ReadingEmailApiModel, SettingsApiModel } from '@app-types/models';
import { createSettingsMockModel } from '@mocks/handlers/settings/models/settingsMockModel.mock';
import { formatEmailDate } from '@utils/dateUtils';
import { fillMessageTemplate } from '@utils/messageTemplateUtils';

// The preview the api builds for a reading: the templates in Settings filled in with the reading as read and its day
// spelled out, and its photo when it has one. The handlers pass in the mock settings, so a save in the demo shows.
export const createReadingEmailMockModel = (
  reading: ReadingApiModel,
  settings: SettingsApiModel = createSettingsMockModel(),
  overrides?: Partial<ReadingEmailApiModel>,
): ReadingEmailApiModel => {
  const values = { reading: reading.digits, date: formatEmailDate(reading.date) };

  return {
    from: settings.from,
    to: settings.to,
    subject: fillMessageTemplate(settings.subjectTemplate, values),
    body: fillMessageTemplate(settings.bodyTemplate, values),
    attachment: reading.photoId === null ? null : { photoId: reading.photoId, name: `meter-${reading.date}.jpg` },
    ...overrides,
  };
};

export const createEmailDefaultsMockModel = (
  settings: SettingsApiModel = createSettingsMockModel(),
  overrides?: Partial<EmailDefaultsApiModel>,
): EmailDefaultsApiModel => ({
  from: settings.from,
  to: settings.to,
  subjectTemplate: settings.subjectTemplate,
  bodyTemplate: settings.bodyTemplate,
  ...overrides,
});
