import { string } from 'yup';

// The API's limits: digits only, at most 15 of them, leading zeros kept.
export const READING_DIGITS_MAX_LENGTH = 15;
const DIGITS_ONLY = /^\d+$/;
// YYYY-MM-DD, the shape a date input gives and the API takes.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Kept as typed apart from the spaces around it: never turned into a number, so "00123" stays "00123".
export const readingDigitsSchema = string()
  .trim()
  .required('Type the reading')
  .matches(DIGITS_ONLY, 'Use digits only, as the meter shows them')
  .max(READING_DIGITS_MAX_LENGTH, `Keep it to ${READING_DIGITS_MAX_LENGTH} digits or fewer`);

export const readingDateSchema = string()
  .required('Pick the day you read the meter')
  .matches(ISO_DATE, 'Pick the day you read the meter');

function withoutLeadingZeros(digits: string): string {
  return digits.replace(/^0+/, '');
}

// Compared as whole numbers of any length, never through Number (it loses digits past 15). A longer number, once its
// leading zeros are gone, is the bigger one; same length compares digit by digit.
export function isReadingLower(digits: string, otherDigits: string): boolean {
  const value = withoutLeadingZeros(digits);
  const otherValue = withoutLeadingZeros(otherDigits);

  if (value.length !== otherValue.length) return value.length < otherValue.length;

  return value < otherValue;
}
