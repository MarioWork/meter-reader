// How {date} is written in every email (docs/GLOSSARY.md: Date format), as the API sends and takes it. Here, not in
// settings.dateFormat.ts, so the modules that carry it (readings' email defaults) reach it as a type of this module.
export const MESSAGE_DATE_FORMATS = {
  // "31 October 2026", a fresh install's.
  LONG_MONTH: 'longMonth',
  // "31 Oct 2026".
  SHORT_MONTH: 'shortMonth',
  // "31/10/2026".
  DAY_MONTH_YEAR: 'dayMonthYear',
  // "2026-10-31".
  ISO: 'iso',
} as const;

export type MessageDateFormat = (typeof MESSAGE_DATE_FORMATS)[keyof typeof MESSAGE_DATE_FORMATS];

// What every reading's email is filled in from, for the modules that build that email: the subject and body
// templates, and how {date} is written in them.
export type MessageSettings = { subject: string; body: string; dateFormat: MessageDateFormat };

// What goes in place of each placeholder: the reading as read, and the day already written out.
export type MessageValues = { reading: string; date: string };
