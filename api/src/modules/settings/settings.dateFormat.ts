// How {date} is written in every email (docs/GLOSSARY.md: Date format), chosen in Settings. The day is spelled by
// hand, not by Intl: the web app spells it the same way (web/src/common/utils/messageDateFormatUtils.ts), so its
// preview cannot drift from what is sent when Node's and the browser's locale data disagree (en-GB's "Sept", for one).
import { MESSAGE_DATE_FORMATS, type MessageDateFormat } from './settings.type.ts';

export const DEFAULT_MESSAGE_DATE_FORMAT: MessageDateFormat = MESSAGE_DATE_FORMATS.LONG_MONTH;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const SHORT_MONTH_NAME_LENGTH = 3;
const PAD_LENGTH = 2;
const MONTH_OFFSET = 1;
const SLASH = '/';
const DASH = '-';

// One calendar day, in parts: the day of the month, the month (0-11) and the year.
type DayParts = { day: number; monthIndex: number; year: number };

function pad(value: number): string {
  return String(value).padStart(PAD_LENGTH, '0');
}

const FORMATTER_MAP: Record<MessageDateFormat, (parts: DayParts) => string> = {
  [MESSAGE_DATE_FORMATS.LONG_MONTH]: ({ day, monthIndex, year }) => `${day} ${MONTH_NAMES[monthIndex]} ${year}`,
  [MESSAGE_DATE_FORMATS.SHORT_MONTH]: ({ day, monthIndex, year }) =>
    `${day} ${MONTH_NAMES[monthIndex]?.slice(0, SHORT_MONTH_NAME_LENGTH)} ${year}`,
  [MESSAGE_DATE_FORMATS.DAY_MONTH_YEAR]: ({ day, monthIndex, year }) =>
    [pad(day), pad(monthIndex + MONTH_OFFSET), year].join(SLASH),
  [MESSAGE_DATE_FORMATS.ISO]: ({ day, monthIndex, year }) =>
    [year, pad(monthIndex + MONTH_OFFSET), pad(day)].join(DASH),
};

// A calendar day (midnight UTC, as Postgres hands back a `date`) written the way {date} reads in an email.
export function formatMessageDate(date: Date, dateFormat: MessageDateFormat): string {
  const parts = { day: date.getUTCDate(), monthIndex: date.getUTCMonth(), year: date.getUTCFullYear() };

  return FORMATTER_MAP[dateFormat](parts);
}
