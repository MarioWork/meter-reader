import type { ReadingStatusUtil } from '@app-types/utility';
import type { DatePreset } from './datePreset.type';

// What the history is narrowed to, as the url holds it. Both days are inclusive calendar days (YYYY-MM-DD), either
// one may be left open. No statuses means every status.
export type HistoryFilterValues = {
  dateFrom?: string;
  dateTo?: string;
  statuses: ReadingStatusUtil[];
};

// The two ends of a day range, either one open.
export type DayRange = Pick<HistoryFilterValues, 'dateFrom' | 'dateTo'>;

// One active filter shown above the history, and the filters left once it is removed.
export type HistoryFilterChip = {
  id: string;
  label: string;
  remainingFilters: HistoryFilterValues;
};

// The filters' choices before they are applied. No preset means any day. The custom range is whole months
// (YYYY-MM), empty while not picked: From starts on its month's first day, To ends on its month's last day.
export type HistoryFilterDraft = {
  datePreset?: DatePreset;
  customFrom: string;
  customTo: string;
  statuses: ReadingStatusUtil[];
};
