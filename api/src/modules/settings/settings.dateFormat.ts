// How {date} is written in every email (docs/GLOSSARY.md: Date format, Date language), chosen in Settings. The day is
// spelled by hand, not by Intl: the web app spells it the same way (web/src/common/utils/messageDateFormatUtils.ts),
// so its preview cannot drift from what is sent when Node's and the browser's locale data disagree (en-GB's "Sept",
// for one).
import {
  MESSAGE_DATE_FORMATS,
  MESSAGE_DATE_LANGUAGES,
  type MessageDateFormat,
  type MessageDateLanguage,
} from './settings.type.ts';

export const DEFAULT_MESSAGE_DATE_FORMAT: MessageDateFormat = MESSAGE_DATE_FORMATS.LONG_MONTH;
export const DEFAULT_MESSAGE_DATE_LANGUAGE: MessageDateLanguage = MESSAGE_DATE_LANGUAGES.ENGLISH;

// Portuguese months are written in lower case, as they are in a sentence.
const MONTH_NAMES_MAP: Record<MessageDateLanguage, readonly string[]> = {
  [MESSAGE_DATE_LANGUAGES.ENGLISH]: [
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
  [MESSAGE_DATE_LANGUAGES.PORTUGUESE]: [
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

// One calendar day, in parts: the day of the month, the month's name and number (0-11), and the year.
type DayParts = { day: number; monthIndex: number; monthName: string; year: number; dateLanguage: MessageDateLanguage };

function pad(value: number): string {
  return String(value).padStart(PAD_LENGTH, '0');
}

// "31 October 2026" in English, "31 de outubro de 2026" in Portuguese.
const LONG_DATE_MAP: Record<MessageDateLanguage, (parts: DayParts) => string> = {
  [MESSAGE_DATE_LANGUAGES.ENGLISH]: ({ day, monthName, year }) => `${day} ${monthName} ${year}`,
  [MESSAGE_DATE_LANGUAGES.PORTUGUESE]: ({ day, monthName, year }) => `${day} de ${monthName} de ${year}`,
};

const FORMATTER_MAP: Record<MessageDateFormat, (parts: DayParts) => string> = {
  [MESSAGE_DATE_FORMATS.LONG_MONTH]: (parts) => LONG_DATE_MAP[parts.dateLanguage](parts),
  [MESSAGE_DATE_FORMATS.SHORT_MONTH]: ({ day, monthName, year }) =>
    `${day} ${monthName.slice(0, SHORT_MONTH_NAME_LENGTH)} ${year}`,
  [MESSAGE_DATE_FORMATS.DAY_MONTH_YEAR]: ({ day, monthIndex, year }) =>
    [pad(day), pad(monthIndex + MONTH_OFFSET), year].join(SLASH),
  [MESSAGE_DATE_FORMATS.ISO]: ({ day, monthIndex, year }) =>
    [year, pad(monthIndex + MONTH_OFFSET), pad(day)].join(DASH),
};

// A calendar day (midnight UTC, as Postgres hands back a `date`) written the way {date} reads in an email, in the
// format and language chosen in Settings. The numeric formats read the same in either language.
export function formatMessageDate(
  date: Date,
  dateFormat: MessageDateFormat,
  dateLanguage: MessageDateLanguage = DEFAULT_MESSAGE_DATE_LANGUAGE,
): string {
  const monthIndex = date.getUTCMonth();
  const monthName = MONTH_NAMES_MAP[dateLanguage][monthIndex] ?? '';
  const parts = { day: date.getUTCDate(), monthIndex, monthName, year: date.getUTCFullYear(), dateLanguage };

  return FORMATTER_MAP[dateFormat](parts);
}
