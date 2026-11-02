import { string } from 'yup';
import { todayAsIsoDate } from './dateUtils';

// The API's limits: digits only, at most 15 of them, leading zeros kept.
export const READING_DIGITS_MAX_LENGTH = 15;
const DIGITS_ONLY = /^\d+$/;
// YYYY-MM-DD, the shape a date input gives and the API takes.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const LEADING_ZEROS = /^0+/;
const PICK_A_DAY_MESSAGE = 'Pick the day you read the meter';

// Kept as typed apart from the spaces around it: never turned into a number, so "00123" stays "00123".
export const readingDigitsSchema = string()
  .trim()
  .required('Type the reading')
  .matches(DIGITS_ONLY, 'Use digits only, as the meter shows them')
  .max(READING_DIGITS_MAX_LENGTH, `Keep it to ${READING_DIGITS_MAX_LENGTH} digits or fewer`);

// Not after today, in the user's own time zone. YYYY-MM-DD strings sort as the days do.
export const readingDateSchema = string()
  .required(PICK_A_DAY_MESSAGE)
  .matches(ISO_DATE, PICK_A_DAY_MESSAGE)
  .test('not-in-future', 'Pick today or a day before it', (date) => date <= todayAsIsoDate());

function withoutLeadingZeros(digits: string): string {
  return digits.replace(LEADING_ZEROS, '');
}

// Compared as whole numbers of any length, never through Number (it loses digits past 15). A longer number, once its
// leading zeros are gone, is the bigger one; same length compares digit by digit.
export function isReadingLower(digits: string, otherDigits: string): boolean {
  const number = withoutLeadingZeros(digits);
  const otherNumber = withoutLeadingZeros(otherDigits);

  if (number.length !== otherNumber.length) return number.length < otherNumber.length;

  return number < otherNumber;
}
