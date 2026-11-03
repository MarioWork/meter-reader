import type { ReadingApiModel, ReadingId } from '@app-types/models';
import { MOCK_PROVIDER_EMAIL } from '@mocks/handlers/settings/models/settingsMockModel.mock';
import { ReadingStatusUtil } from '@app-types/utility';
import { createReadingEmailMockModel } from './readingEmailMockModel.mock';

// Fixed, so every run serves the same rows and tests can assert them: one reading on the first of each month,
// counting up as a meter does, starting September 2025.
const FIRST_YEAR = 2025;
const FIRST_MONTH_INDEX = 8;
const MONTHS_PER_YEAR = 12;
const FIRST_DIGITS = 412;
const MONTHLY_USE = 9;
const DIGIT_COUNT = 5;
const MONTH_OFFSET = 1;
const MONTH_LENGTH = 2;
// Every mock reading was taken at the same time of day, and the sent ones went out half an hour later.
const MOCK_READ_TIME = 'T08:30:00.000Z';
const MOCK_SENT_TIME = 'T09:00:00.000Z';

// Most of the history went out. The newest reading and one without a photo are waiting to be sent, and the one
// before the newest failed, so the history shows every status.
const NOT_SENT_READING_IDS: ReadingId[] = [10, 14];
const FAILED_READING_IDS: ReadingId[] = [13];

// Every fifth reading was saved without a photo, so the history shows both kinds.
const NO_PHOTO_EVERY = 5;
const NO_PHOTO_REMAINDER = 0;

// More than one page, so paging can be seen working.
export const READING_MOCK_COUNT = 14;

function monthStart(monthsAfterFirst: number): string {
  const monthIndex = FIRST_MONTH_INDEX + monthsAfterFirst;
  const year = FIRST_YEAR + Math.floor(monthIndex / MONTHS_PER_YEAR);
  const month = (monthIndex % MONTHS_PER_YEAR) + MONTH_OFFSET;

  return `${year}-${String(month).padStart(MONTH_LENGTH, '0')}-01`;
}

export const createReadingMockModel = (overrides?: Partial<ReadingApiModel>): ReadingApiModel => ({
  id: 1,
  digits: '00412',
  date: monthStart(0),
  status: ReadingStatusUtil.NOT_SENT,
  createdAt: `${monthStart(0)}${MOCK_READ_TIME}`,
  photoId: 1,
  sentAt: null,
  sentEmail: null,
  ...overrides,
});

type SendOutcome = Pick<ReadingApiModel, 'status' | 'sentAt' | 'sentEmail'>;

// A sent mock reading went out as the API's own email, with its photo when it had one.
function sendOutcome(reading: ReadingApiModel): SendOutcome {
  if (NOT_SENT_READING_IDS.includes(reading.id)) {
    return { status: ReadingStatusUtil.NOT_SENT, sentAt: null, sentEmail: null };
  }

  if (FAILED_READING_IDS.includes(reading.id)) {
    return { status: ReadingStatusUtil.FAILED, sentAt: null, sentEmail: null };
  }

  const { from, subject, body } = createReadingEmailMockModel(reading);
  const sentEmail = { from, to: MOCK_PROVIDER_EMAIL, subject, body, hasPhoto: reading.photoId !== null };

  return { status: ReadingStatusUtil.SENT, sentAt: `${reading.date}${MOCK_SENT_TIME}`, sentEmail };
}

// Oldest first, as they were saved.
export const createReadingMockModelList = (length: number, overrides?: Partial<ReadingApiModel>): ReadingApiModel[] =>
  Array.from({ length }, (_, index) => {
    const reading = createReadingMockModel({
      id: index + 1,
      digits: String(FIRST_DIGITS + index * MONTHLY_USE).padStart(DIGIT_COUNT, '0'),
      date: monthStart(index),
      createdAt: `${monthStart(index)}${MOCK_READ_TIME}`,
      // A mock history photo has its reading's id (getPhoto.mock.handler.ts draws it).
      photoId: (index + 1) % NO_PHOTO_EVERY === NO_PHOTO_REMAINDER ? null : index + 1,
    });

    return { ...reading, ...sendOutcome(reading), ...overrides };
  });
