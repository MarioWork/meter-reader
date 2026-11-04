// Calendar days travel as YYYY-MM-DD. They have no time zone: a day is shown as the same day everywhere.
const DISPLAY_LOCALE = 'en-GB';
const DAY_FORMAT = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const MONTH_OFFSET = 1;
const DAY_MS = 86_400_000;
const PAD_LENGTH = 2;
// A moment (when a reading was sent), in the user's own time zone.
const MOMENT_FORMAT = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
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

// The whole days from one calendar day to a later one: "2026-09-01" to "2026-10-01" is 30. Both are read in UTC, so a
// change to or from summer time never makes a day 23 or 25 hours long.
export function daysBetween(fromIsoDate: string, untilIsoDate: string): number {
  const from = Date.parse(`${fromIsoDate}${START_OF_DAY_UTC}`);
  const until = Date.parse(`${untilIsoDate}${START_OF_DAY_UTC}`);

  return Math.round((until - from) / DAY_MS);
}

// "2026-11-02T09:00:00.000Z" → "2 Nov 2026, 09:00" (in the user's time zone).
export function formatTimestamp(isoTimestamp: string): string {
  return MOMENT_FORMAT.format(new Date(isoTimestamp));
}
