import { mixed } from 'yup';
import { MessageDateFormatUtil } from '@app-types/utility';

// How {date} is written in an email (docs/GLOSSARY.md: Date format), spelled exactly as the API spells it
// (api/src/modules/settings/settings.dateFormat.ts). By hand, not by Intl: the browser's locale data and Node's can
// disagree (en-GB's "Sept", for one), and the preview must read as what is sent.

// The app's own wording, wherever the format was refused.
export const UNKNOWN_DATE_FORMAT_MESSAGE = 'Pick a date format from the list.';

// Every format, in the order the Settings dropdown offers them.
export const MESSAGE_DATE_FORMAT_OPTIONS: readonly MessageDateFormatUtil[] = Object.values(MessageDateFormatUtil);

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

const FORMATTER_MAP: Record<MessageDateFormatUtil, (parts: DayParts) => string> = {
  [MessageDateFormatUtil.LONG_MONTH]: ({ day, monthIndex, year }) => `${day} ${MONTH_NAMES[monthIndex]} ${year}`,
  [MessageDateFormatUtil.SHORT_MONTH]: ({ day, monthIndex, year }) =>
    `${day} ${MONTH_NAMES[monthIndex]?.slice(0, SHORT_MONTH_NAME_LENGTH)} ${year}`,
  [MessageDateFormatUtil.DAY_MONTH_YEAR]: ({ day, monthIndex, year }) =>
    [pad(day), pad(monthIndex + MONTH_OFFSET), year].join(SLASH),
  [MessageDateFormatUtil.ISO]: ({ day, monthIndex, year }) =>
    [year, pad(monthIndex + MONTH_OFFSET), pad(day)].join(DASH),
};

// "2026-10-31" → its day, month and year, read as written: a calendar day has no time zone.
function toDayParts(isoDate: string): DayParts {
  const [year, month, day] = isoDate.split(DASH).map(Number);

  return { day: day ?? 0, monthIndex: (month ?? 0) - MONTH_OFFSET, year: year ?? 0 };
}

// "2026-10-31" written the way {date} reads in an email, in the format chosen in Settings.
export function formatMessageDate(isoDate: string, dateFormat: MessageDateFormatUtil): string {
  return FORMATTER_MAP[dateFormat](toDayParts(isoDate));
}

// The date format as the Settings form and the save action both check it: one of the four, nothing else.
export const messageDateFormatSchema = mixed<MessageDateFormatUtil>()
  .oneOf(MESSAGE_DATE_FORMAT_OPTIONS, UNKNOWN_DATE_FORMAT_MESSAGE)
  .required(UNKNOWN_DATE_FORMAT_MESSAGE);
