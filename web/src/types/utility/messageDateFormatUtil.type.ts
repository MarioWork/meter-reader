// How {date} is written in every email, as the API sends it (docs/GLOSSARY.md: Date format).
export const MessageDateFormatUtil = {
  // "31 October 2026", a fresh install's.
  LONG_MONTH: 'longMonth',
  // "31 Oct 2026".
  SHORT_MONTH: 'shortMonth',
  // "31/10/2026".
  DAY_MONTH_YEAR: 'dayMonthYear',
  // "2026-10-31".
  ISO: 'iso',
} as const;

export type MessageDateFormatUtil = (typeof MessageDateFormatUtil)[keyof typeof MessageDateFormatUtil];
