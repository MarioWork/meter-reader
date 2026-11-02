// Whether a reading's email went out, as the API sends it: not sent yet, sent, or failed (docs/GLOSSARY.md).
export const ReadingStatusUtil = {
  NOT_SENT: 'notSent',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

export type ReadingStatusUtil = (typeof ReadingStatusUtil)[keyof typeof ReadingStatusUtil];
