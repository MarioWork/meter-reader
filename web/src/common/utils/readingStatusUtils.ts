import { ReadingStatusUtil } from '@app-types/utility';

// A reading's status as Home words it, on its status chip and in the filters (docs/GLOSSARY.md).
export const READING_STATUS_LABELS: Record<ReadingStatusUtil, string> = {
  [ReadingStatusUtil.NOT_SENT]: 'Not sent',
  [ReadingStatusUtil.SENT]: 'Sent',
  [ReadingStatusUtil.FAILED]: 'Failed',
};

// Every status, in the order the filters list them.
export const READING_STATUSES = Object.values(ReadingStatusUtil);
