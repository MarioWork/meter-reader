// Calendar days travel as YYYY-MM-DD. They have no time zone: a day is shown as the same day everywhere.
const DISPLAY_LOCALE = 'en-GB';
const DAY_FORMAT = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const MONTH_OFFSET = 1;
const PAD_LENGTH = 2;
// A moment (when a reading was sent), in the user's own time zone.
const MOMENT_FORMAT = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
// As the API spells the day in its emails ({date} in a template): "3 November 2026".
const EMAIL_DAY_FORMAT = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
// A calendar day read as the start of that day in UTC, so formatting in UTC shows the same day.
const START_OF_DAY_UTC = 'T00:00:00.000Z';
// YYYY-MM-DD, the shape a date input gives and the API takes.
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function pad(value: number): string {
  return String(value).padStart(PAD_LENGTH, '0');
}

// The local calendar day of a moment, as a date input wants it.
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + MONTH_OFFSET)}-${pad(date.getDate())}`;
}

// Today in the user's own time zone, as a date input wants it.
export function todayAsIsoDate(now = new Date()): string {
  return toIsoDate(now);
}

// "2026-10-31" → "31 Oct 2026".
export function formatIsoDate(isoDate: string): string {
  return DAY_FORMAT.format(new Date(`${isoDate}${START_OF_DAY_UTC}`));
}

// "2026-11-03" → "3 November 2026", the way {date} reads in an email.
export function formatEmailDate(isoDate: string): string {
  return EMAIL_DAY_FORMAT.format(new Date(`${isoDate}${START_OF_DAY_UTC}`));
}

// "2026-11-02T09:00:00.000Z" → "2 Nov 2026, 09:00" (in the user's time zone).
export function formatTimestamp(isoTimestamp: string): string {
  return MOMENT_FORMAT.format(new Date(isoTimestamp));
}
