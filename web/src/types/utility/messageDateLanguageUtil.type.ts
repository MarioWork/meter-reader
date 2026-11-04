// The language a month's name is written in, in {date}, as the API sends it (docs/GLOSSARY.md: Date language).
export const MessageDateLanguageUtil = {
  // "31 October 2026", a fresh install's.
  ENGLISH: 'en',
  // "31 de outubro de 2026".
  PORTUGUESE: 'pt',
} as const;

export type MessageDateLanguageUtil = (typeof MessageDateLanguageUtil)[keyof typeof MessageDateLanguageUtil];
