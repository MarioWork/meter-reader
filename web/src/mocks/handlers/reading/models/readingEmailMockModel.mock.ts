import type { EmailDefaultsApiModel, ReadingApiModel, ReadingEmailApiModel, SettingsApiModel } from '@app-types/models';
import { ReadingStatusUtil } from '@app-types/utility';
import { createSettingsMockModel } from '@mocks/handlers/settings/models/settingsMockModel.mock';
import { formatMessageDate } from '@utils/messageDateFormatUtils';
import { fillMessageTemplate } from '@utils/messageTemplateUtils';

// The preview the api builds for a reading: the templates in Settings filled in with the reading as read and its day
// written in the date format chosen there, and its photo when it has one. The handlers pass in the mock settings, so
// a save in the demo shows.
export const createReadingEmailMockModel = (
  reading: ReadingApiModel,
  settings: SettingsApiModel = createSettingsMockModel(),
  overrides?: Partial<ReadingEmailApiModel>,
): ReadingEmailApiModel => {
  const values = {
    reading: reading.digits,
    date: formatMessageDate(reading.date, settings.dateFormat, settings.dateLanguage),
    client: settings.clientNumber,
  };

  return {
    from: settings.from,
    to: settings.to,
    subject: fillMessageTemplate(settings.subjectTemplate, values),
    body: fillMessageTemplate(settings.bodyTemplate, values),
    attachment: reading.photoId === null ? null : { photoId: reading.photoId, name: `meter-${reading.date}.jpg` },
    ...overrides,
  };
};

// What the preview starts from, as the api builds it: a sent reading's own subject and body, so a Resend repeats the
// email it went out with; the templates for any other.
export const createReadingPreviewMockModel = (
  reading: ReadingApiModel,
  settings: SettingsApiModel = createSettingsMockModel(),
): ReadingEmailApiModel => {
  const email = createReadingEmailMockModel(reading, settings);
  const { status, sentEmail } = reading;
  const isNotSentYet = status !== ReadingStatusUtil.SENT;

  if (isNotSentYet || sentEmail === null) return email;

  return { ...email, subject: sentEmail.subject, body: sentEmail.body };
};

export const createEmailDefaultsMockModel = (
  settings: SettingsApiModel = createSettingsMockModel(),
  overrides?: Partial<EmailDefaultsApiModel>,
): EmailDefaultsApiModel => ({
  from: settings.from,
  to: settings.to,
  subjectTemplate: settings.subjectTemplate,
  bodyTemplate: settings.bodyTemplate,
  dateFormat: settings.dateFormat,
  dateLanguage: settings.dateLanguage,
  clientNumber: settings.clientNumber,
  ...overrides,
});
