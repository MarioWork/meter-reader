import type { ReadingApiModel } from '@app-types/models';
import { ReadingStatusUtil } from '@app-types/utility';

// Fixed, so every run serves the same rows and tests can assert them: one reading on the first of each month,
// counting up as a meter does, starting September 2025.
const FIRST_YEAR = 2025;
const FIRST_MONTH_INDEX = 8;
const MONTHS_PER_YEAR = 12;
const FIRST_DIGITS = 412;
const MONTHLY_USE = 9;
const DIGIT_COUNT = 5;

// More than one page, so paging can be seen working.
export const READING_MOCK_COUNT = 14;

function monthStart(monthsAfterFirst: number): string {
  const monthIndex = FIRST_MONTH_INDEX + monthsAfterFirst;
  const year = FIRST_YEAR + Math.floor(monthIndex / MONTHS_PER_YEAR);
  const month = (monthIndex % MONTHS_PER_YEAR) + 1;

  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export const createReadingMockModel = (overrides?: Partial<ReadingApiModel>): ReadingApiModel => ({
  id: 1,
  digits: '00412',
  date: monthStart(0),
  status: ReadingStatusUtil.NOT_SENT,
  createdAt: `${monthStart(0)}T08:30:00.000Z`,
  ...overrides,
});

// Oldest first, as they were saved.
export const createReadingMockModelList = (length: number, overrides?: Partial<ReadingApiModel>): ReadingApiModel[] =>
  Array.from({ length }, (_, index) =>
    createReadingMockModel({
      id: index + 1,
      digits: String(FIRST_DIGITS + index * MONTHLY_USE).padStart(DIGIT_COUNT, '0'),
      date: monthStart(index),
      createdAt: `${monthStart(index)}T08:30:00.000Z`,
      ...overrides,
    }),
  );
