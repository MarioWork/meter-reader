import type { EmailDefaultsApiModel, ReadingApiModel, ReadingEmailApiModel } from '@app-types/models';

// The api's settings for every email (MAIL_FROM, PROVIDER_EMAIL and MAIL_SUBJECT in api/.env.example).
const MOCK_FROM_EMAIL = 'me@hotmail.example';
const MOCK_PROVIDER_EMAIL = 'readings@water-provider.example';
const MOCK_SUBJECT = 'test';
// The api spells the day out: "1 October 2026".
const EMAIL_DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

// The preview the api builds for a reading: the date and the reading as read, and its photo when it has one.
export const createReadingEmailMockModel = (
  reading: ReadingApiModel,
  overrides?: Partial<ReadingEmailApiModel>,
): ReadingEmailApiModel => ({
  from: MOCK_FROM_EMAIL,
  to: MOCK_PROVIDER_EMAIL,
  subject: MOCK_SUBJECT,
  body: `Date: ${EMAIL_DATE_FORMAT.format(new Date(reading.date))}\nReading: ${reading.digits}`,
  attachment: reading.photoId === null ? null : { photoId: reading.photoId, name: `meter-${reading.date}.jpg` },
  ...overrides,
});

export const createEmailDefaultsMockModel = (overrides?: Partial<EmailDefaultsApiModel>): EmailDefaultsApiModel => ({
  from: MOCK_FROM_EMAIL,
  to: MOCK_PROVIDER_EMAIL,
  subject: MOCK_SUBJECT,
  ...overrides,
});
