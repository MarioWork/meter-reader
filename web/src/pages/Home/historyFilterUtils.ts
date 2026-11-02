import type { ReadingStatusUtil } from '@app-types/utility';
import { HOME_SEARCH_PARAMS } from '@application/routes/routesUtils';
import { formatIsoDate, ISO_DATE_PATTERN, toIsoDate } from '@utils/dateUtils';
import { READING_STATUS_LABELS, READING_STATUSES } from './readingStatusLabels';
import type { DayRange, HistoryFilterChip, HistoryFilterDraft, HistoryFilterValues, NamedDatePreset } from './types';
// The value set itself, not only its type, so from its own file: the types barrel is type-only.
import { DatePreset } from './types/datePreset.type';

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  [DatePreset.THIS_MONTH]: 'This month',
  [DatePreset.LAST_THREE_MONTHS]: 'Last 3 months',
  [DatePreset.THIS_YEAR]: 'This year',
  [DatePreset.CUSTOM]: 'Custom',
};

export const DATE_PRESETS = Object.values(DatePreset);

const NAMED_DATE_PRESETS: NamedDatePreset[] = [
  DatePreset.THIS_MONTH,
  DatePreset.LAST_THREE_MONTHS,
  DatePreset.THIS_YEAR,
];

const STATUS_SEPARATOR = ',';
const DATE_PART_SEPARATOR = '-';
const MONTH_OFFSET = 1;
const FIRST_DAY = 1;
const JANUARY = 0;
const THIS_MONTH_OFFSET = 0;
// "Last 3 months" is this month and the two before it.
const EARLIER_MONTHS_IN_LAST_THREE = 2;
const DATE_CHIP_ID = 'date';
const RANGE_SEPARATOR = ' – ';
const OPEN_END_PREFIX = 'From';
const OPEN_START_PREFIX = 'Until';

// The first day of the month `monthsBack` before the one `now` is in; the Date constructor rolls into last year.
function monthStart(now: Date, monthsBack: number): string {
  return toIsoDate(new Date(now.getFullYear(), now.getMonth() - monthsBack, FIRST_DAY));
}

const PRESET_STARTS: Record<NamedDatePreset, (now: Date) => string> = {
  [DatePreset.THIS_MONTH]: (now) => monthStart(now, THIS_MONTH_OFFSET),
  [DatePreset.LAST_THREE_MONTHS]: (now) => monthStart(now, EARLIER_MONTHS_IN_LAST_THREE),
  [DatePreset.THIS_YEAR]: (now) => toIsoDate(new Date(now.getFullYear(), JANUARY, FIRST_DAY)),
};

// A preset's days, from its first day up to today (in the user's own time zone).
export function datePresetRange(preset: NamedDatePreset, now = new Date()): Required<DayRange> {
  return { dateFrom: PRESET_STARTS[preset](now), dateTo: toIsoDate(now) };
}

// True for a day that exists: YYYY-MM-DD, and the calendar has it (no 2026-13-45, no 2026-02-30).
function isRealIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;

  const [year, month, day] = value.split(DATE_PART_SEPARATOR).map(Number);
  const date = new Date(year, month - MONTH_OFFSET, day);

  return toIsoDate(date) === value;
}

function readIsoDate(searchParams: URLSearchParams, name: string): string | undefined {
  const value = searchParams.get(name);

  if (value === null || !isRealIsoDate(value)) return undefined;

  return value;
}

function isReadingStatus(value: string): value is ReadingStatusUtil {
  return READING_STATUSES.some((status) => status === value);
}

// The statuses in the order the filters list them, each once, so the same choice always makes the same url.
function inStatusOrder(statuses: ReadingStatusUtil[]): ReadingStatusUtil[] {
  return READING_STATUSES.filter((status) => statuses.includes(status));
}

// True when both ends are picked and the range ends before it starts. YYYY-MM-DD strings sort as the days do.
export function isRangeBackwards({ dateFrom, dateTo }: DayRange): boolean {
  if (!dateFrom || !dateTo) return false;

  return dateFrom > dateTo;
}

function readDayRange(searchParams: URLSearchParams): DayRange {
  const dateFrom = readIsoDate(searchParams, HOME_SEARCH_PARAMS.DATE_FROM);
  const dateTo = readIsoDate(searchParams, HOME_SEARCH_PARAMS.DATE_TO);

  if (isRangeBackwards({ dateFrom, dateTo })) return {};

  return { dateFrom, dateTo };
}

// The filters a url asks for. Anything the API would refuse is left out instead (a day that is not YYYY-MM-DD, a
// status it does not know, a range that ends before it starts), so a hand-edited url never lands on the error page.
export function readHistoryFilters(searchParams: URLSearchParams): HistoryFilterValues {
  // Both `status=sent,failed` and `status=sent&status=failed`.
  const statusValues = searchParams
    .getAll(HOME_SEARCH_PARAMS.STATUSES)
    .flatMap((statusParam) => statusParam.split(STATUS_SEPARATOR));
  const statuses = inStatusOrder(statusValues.filter(isReadingStatus));

  return { ...readDayRange(searchParams), statuses };
}

function setOrDelete(searchParams: URLSearchParams, name: string, value: string | undefined) {
  if (value) {
    searchParams.set(name, value);

    return;
  }

  searchParams.delete(name);
}

// A copy of the url's search params with these filters in place of the old ones. The history starts again from its
// first page, so the shown-pages count goes.
export function withHistoryFilters(searchParams: URLSearchParams, filters: HistoryFilterValues): URLSearchParams {
  const nextSearchParams = new URLSearchParams(searchParams);

  nextSearchParams.delete(HOME_SEARCH_PARAMS.SHOWN_PAGES);
  setOrDelete(nextSearchParams, HOME_SEARCH_PARAMS.DATE_FROM, filters.dateFrom);
  setOrDelete(nextSearchParams, HOME_SEARCH_PARAMS.DATE_TO, filters.dateTo);
  setOrDelete(nextSearchParams, HOME_SEARCH_PARAMS.STATUSES, filters.statuses.join(STATUS_SEPARATOR));

  return nextSearchParams;
}

function hasDayRange({ dateFrom, dateTo }: DayRange): boolean {
  return dateFrom !== undefined || dateTo !== undefined;
}

export function hasHistoryFilters(filters: HistoryFilterValues): boolean {
  return hasDayRange(filters) || filters.statuses.length > 0;
}

// The preset whose days are exactly these today, if any.
function matchingNamedPreset(range: DayRange, now: Date): NamedDatePreset | undefined {
  return NAMED_DATE_PRESETS.find((preset) => {
    const presetRange = datePresetRange(preset, now);

    return presetRange.dateFrom === range.dateFrom && presetRange.dateTo === range.dateTo;
  });
}

function customRangeLabel({ dateFrom, dateTo }: DayRange): string {
  if (dateFrom && dateTo) return `${formatIsoDate(dateFrom)}${RANGE_SEPARATOR}${formatIsoDate(dateTo)}`;

  if (dateTo) return `${OPEN_START_PREFIX} ${formatIsoDate(dateTo)}`;

  return `${OPEN_END_PREFIX} ${formatIsoDate(dateFrom ?? '')}`;
}

function dateRangeChip(filters: HistoryFilterValues, now: Date): HistoryFilterChip {
  const preset = matchingNamedPreset(filters, now);
  const label = preset ? DATE_PRESET_LABELS[preset] : customRangeLabel(filters);

  return { id: DATE_CHIP_ID, label, remainingFilters: { statuses: filters.statuses } };
}

function statusChip(filters: HistoryFilterValues, status: ReadingStatusUtil): HistoryFilterChip {
  const otherStatuses = filters.statuses.filter((filterStatus) => filterStatus !== status);

  return {
    id: status,
    label: READING_STATUS_LABELS[status],
    remainingFilters: { ...filters, statuses: otherStatuses },
  };
}

// One chip for the day range, named after its preset when it matches one today, and one per status.
export function historyFilterChips(filters: HistoryFilterValues, now = new Date()): HistoryFilterChip[] {
  const statusChips = filters.statuses.map((status) => statusChip(filters, status));

  if (!hasDayRange(filters)) return statusChips;

  return [dateRangeChip(filters, now), ...statusChips];
}

// The filter sheet's starting point: the url's filters, with the preset its range matches, or Custom with its days.
export function historyFilterDraft(filters: HistoryFilterValues, now = new Date()): HistoryFilterDraft {
  const customDraft = {
    customFrom: filters.dateFrom ?? '',
    customTo: filters.dateTo ?? '',
    statuses: filters.statuses,
  };

  if (!hasDayRange(filters)) return customDraft;

  return { ...customDraft, datePreset: matchingNamedPreset(filters, now) ?? DatePreset.CUSTOM };
}

function draftDayRange({ datePreset, customFrom, customTo }: HistoryFilterDraft, now: Date): DayRange {
  if (datePreset === undefined) return {};

  if (datePreset === DatePreset.CUSTOM) {
    // An empty date input leaves its end of the range open.
    return { dateFrom: customFrom || undefined, dateTo: customTo || undefined };
  }

  return datePresetRange(datePreset, now);
}

// The filters the sheet's choices make: a preset becomes today's days for it.
export function historyFiltersFromDraft(draft: HistoryFilterDraft, now = new Date()): HistoryFilterValues {
  return { ...draftDayRange(draft, now), statuses: inStatusOrder(draft.statuses) };
}
