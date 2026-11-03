import type { SettingsApiModel } from '@app-types/models';
import { MessageDateFormatUtil } from '@app-types/utility';

// MAIL_FROM in api/.env.example, and settings already saved, so dev, the demo and the tests can send straight away.
// The templates are the user's own, not a fresh install's, with both placeholders in the subject too.
const MOCK_FROM_EMAIL = 'me@hotmail.example';
export const MOCK_PROVIDER_EMAIL = 'readings@water-provider.example';
const MOCK_SUBJECT_TEMPLATE = 'Meter reading {date}';
const MOCK_BODY_TEMPLATE = 'Date: {date}\nReading: {reading}';
// A fresh install's: "31 October 2026".
const MOCK_DATE_FORMAT = MessageDateFormatUtil.LONG_MONTH;

export const createSettingsMockModel = (overrides?: Partial<SettingsApiModel>): SettingsApiModel => ({
  from: MOCK_FROM_EMAIL,
  to: MOCK_PROVIDER_EMAIL,
  subjectTemplate: MOCK_SUBJECT_TEMPLATE,
  bodyTemplate: MOCK_BODY_TEMPLATE,
  dateFormat: MOCK_DATE_FORMAT,
  ...overrides,
});
