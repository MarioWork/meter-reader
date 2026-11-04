import { mixed } from 'yup';
import { MessageDateFormatUtil, MessageDateLanguageUtil } from '@app-types/utility';

// How {date} is written in an email (docs/GLOSSARY.md: Date format, Date language), spelled exactly as the API spells it
// (api/src/modules/settings/settings.dateFormat.ts). By hand, not by Intl: the browser's locale data and Node's can
// disagree (en-GB's "Sept", for one), and the preview must read as what is sent.

// The app's own wording, wherever the format was refused.
export const UNKNOWN_DATE_FORMAT_MESSAGE = 'Pick a date format from the list.';

// Every format, in the order the Settings dropdown offers them.
export const MESSAGE_DATE_FORMAT_OPTIONS: readonly MessageDateFormatUtil[] = Object.values(MessageDateFormatUtil);

export const UNKNOWN_DATE_LANGUAGE_MESSAGE = 'Pick a date language from the list.';

// Every language, in the order the Settings dropdown offers them, each named in its own language.
export const MESSAGE_DATE_LANGUAGE_OPTIONS: readonly MessageDateLanguageUtil[] = Object.values(MessageDateLanguageUtil);

export const MESSAGE_DATE_LANGUAGE_LABELS: Record<MessageDateLanguageUtil, string> = {
  [MessageDateLanguageUtil.ENGLISH]: 'English',
  [MessageDateLanguageUtil.PORTUGUESE]: 'Português',
};

// Portuguese months are written in lower case, as they are in a sentence.
const MONTH_NAMES_MAP: Record<MessageDateLanguageUtil, readonly string[]> = {
  [MessageDateLanguageUtil.ENGLISH]: [
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
  ],
  [MessageDateLanguageUtil.PORTUGUESE]: [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ],
};

const SHORT_MONTH_NAME_LENGTH = 3;
const PAD_LENGTH = 2;
const MONTH_OFFSET = 1;
const SLASH = '/';
const DASH = '-';

// One calendar day, in parts: the day of the month, the month (0-11) and the year.
type DayParts = { day: number; monthIndex: number; year: number };

// The day with its month's name, in the language chosen.
type NamedDayParts = DayParts & { monthName: string; dateLanguage: MessageDateLanguageUtil };

function pad(value: number): string {
  return String(value).padStart(PAD_LENGTH, '0');
}

// "31 October 2026" in English, "31 de outubro de 2026" in Portuguese.
const LONG_DATE_MAP: Record<MessageDateLanguageUtil, (parts: NamedDayParts) => string> = {
  [MessageDateLanguageUtil.ENGLISH]: ({ day, monthName, year }) => `${day} ${monthName} ${year}`,
  [MessageDateLanguageUtil.PORTUGUESE]: ({ day, monthName, year }) => `${day} de ${monthName} de ${year}`,
};

const FORMATTER_MAP: Record<MessageDateFormatUtil, (parts: NamedDayParts) => string> = {
  [MessageDateFormatUtil.LONG_MONTH]: (parts) => LONG_DATE_MAP[parts.dateLanguage](parts),
  [MessageDateFormatUtil.SHORT_MONTH]: ({ day, monthName, year }) =>
    `${day} ${monthName.slice(0, SHORT_MONTH_NAME_LENGTH)} ${year}`,
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

// "2026-10-31" written the way {date} reads in an email, in the format and language chosen in Settings. The numeric
// formats read the same in either language.
export function formatMessageDate(
  isoDate: string,
  dateFormat: MessageDateFormatUtil,
  dateLanguage: MessageDateLanguageUtil = MessageDateLanguageUtil.ENGLISH,
): string {
  const parts = toDayParts(isoDate);
  const monthName = MONTH_NAMES_MAP[dateLanguage][parts.monthIndex] ?? '';

  return FORMATTER_MAP[dateFormat]({ ...parts, monthName, dateLanguage });
}

// The date format as the Settings form and the save action both check it: one of the four, nothing else.
export const messageDateFormatSchema = mixed<MessageDateFormatUtil>()
  .oneOf(MESSAGE_DATE_FORMAT_OPTIONS, UNKNOWN_DATE_FORMAT_MESSAGE)
  .required(UNKNOWN_DATE_FORMAT_MESSAGE);

// The date language as the Settings form and the save action both check it: one of the two, nothing else.
export const messageDateLanguageSchema = mixed<MessageDateLanguageUtil>()
  .oneOf(MESSAGE_DATE_LANGUAGE_OPTIONS, UNKNOWN_DATE_LANGUAGE_MESSAGE)
  .required(UNKNOWN_DATE_LANGUAGE_MESSAGE);
