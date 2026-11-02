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
// A calendar day read as the start of that day in UTC, so formatting in UTC shows the same day.
const START_OF_DAY_UTC = 'T00:00:00.000Z';

function pad(value: number): string {
  return String(value).padStart(PAD_LENGTH, '0');
}

// Today in the user's own time zone, as a date input wants it.
export function todayAsIsoDate(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + MONTH_OFFSET)}-${pad(now.getDate())}`;
}

// "2026-10-31" → "31 Oct 2026".
export function formatIsoDate(isoDate: string): string {
  return DAY_FORMAT.format(new Date(`${isoDate}${START_OF_DAY_UTC}`));
}

// "2026-11-02T09:00:00.000Z" → "2 Nov 2026, 09:00" (in the user's time zone).
export function formatTimestamp(isoTimestamp: string): string {
  return MOMENT_FORMAT.format(new Date(isoTimestamp));
}
