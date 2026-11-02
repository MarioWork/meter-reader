import { ReadingStatusUtil } from '@app-types/utility';
import { DatePreset } from './types/datePreset.type';
import {
  datePresetRange,
  historyFilterChips,
  historyFiltersFromDraft,
  historyFilterDraft,
  isRangeBackwards,
  readHistoryFilters,
  withHistoryFilters,
} from './historyFilterUtils';

// 15 October 2026, local time.
const NOW = new Date(2026, 9, 15, 10, 30);
const NO_FILTERS = { statuses: [] };

describe('readHistoryFilters', () => {
  it('reads the day range and the statuses from the url', () => {
    const searchParams = new URLSearchParams('from=2026-01-01&to=2026-03-31&status=sent,failed');

    expect(readHistoryFilters(searchParams)).toEqual({
      dateFrom: '2026-01-01',
      dateTo: '2026-03-31',
      statuses: [ReadingStatusUtil.SENT, ReadingStatusUtil.FAILED],
    });
  });

  it('reads no filters from a url without any', () => {
    expect(readHistoryFilters(new URLSearchParams('pages=2'))).toEqual(NO_FILTERS);
  });

  it('leaves out days that are not YYYY-MM-DD and statuses it does not know', () => {
    const searchParams = new URLSearchParams('from=yesterday&to=2026-03-31&status=sent,lost');

    expect(readHistoryFilters(searchParams)).toEqual({ dateTo: '2026-03-31', statuses: [ReadingStatusUtil.SENT] });
  });

  it('leaves out a day the calendar does not have', () => {
    const searchParams = new URLSearchParams('from=2026-13-45&to=2026-02-30');

    expect(readHistoryFilters(searchParams)).toEqual(NO_FILTERS);
  });

  it('reads statuses given as one param each', () => {
    const searchParams = new URLSearchParams('status=failed&status=sent');

    expect(readHistoryFilters(searchParams).statuses).toEqual([ReadingStatusUtil.SENT, ReadingStatusUtil.FAILED]);
  });

  it('leaves out a day range that ends before it starts', () => {
    const searchParams = new URLSearchParams('from=2026-03-31&to=2026-01-01');

    expect(readHistoryFilters(searchParams)).toEqual(NO_FILTERS);
  });
});

describe('isRangeBackwards', () => {
  it('is true only when both ends are picked and the range ends before it starts', () => {
    expect(isRangeBackwards({ dateFrom: '2026-03-01', dateTo: '2026-01-01' })).toBe(true);
    expect(isRangeBackwards({ dateFrom: '2026-01-01', dateTo: '2026-01-01' })).toBe(false);
    expect(isRangeBackwards({ dateFrom: '2026-03-01', dateTo: '' })).toBe(false);
  });
});

describe('withHistoryFilters', () => {
  it('writes the filters and starts the history again from its first page', () => {
    const current = new URLSearchParams('pages=3&status=notSent');

    const next = withHistoryFilters(current, {
      dateFrom: '2026-10-01',
      dateTo: '2026-10-15',
      statuses: [ReadingStatusUtil.SENT, ReadingStatusUtil.FAILED],
    });

    expect(Object.fromEntries(next)).toEqual({ from: '2026-10-01', to: '2026-10-15', status: 'sent,failed' });
  });

  it('removes every filter it is not given', () => {
    const current = new URLSearchParams('from=2026-10-01&to=2026-10-15&status=sent');

    expect(withHistoryFilters(current, NO_FILTERS).toString()).toBe('');
  });
});

describe('datePresetRange', () => {
  it('gives this month up to today', () => {
    expect(datePresetRange(DatePreset.THIS_MONTH, NOW)).toEqual({ dateFrom: '2026-10-01', dateTo: '2026-10-15' });
  });

  it('gives this month and the two before it, up to today', () => {
    expect(datePresetRange(DatePreset.LAST_THREE_MONTHS, NOW)).toEqual({
      dateFrom: '2026-08-01',
      dateTo: '2026-10-15',
    });
  });

  it('goes back into last year for the last 3 months in January', () => {
    expect(datePresetRange(DatePreset.LAST_THREE_MONTHS, new Date(2026, 0, 20))).toEqual({
      dateFrom: '2025-11-01',
      dateTo: '2026-01-20',
    });
  });

  it('gives this year up to today', () => {
    expect(datePresetRange(DatePreset.THIS_YEAR, NOW)).toEqual({ dateFrom: '2026-01-01', dateTo: '2026-10-15' });
  });
});

describe('historyFilterChips', () => {
  it('names a preset range by its preset, and each status on its own', () => {
    const filters = {
      dateFrom: '2026-08-01',
      dateTo: '2026-10-15',
      statuses: [ReadingStatusUtil.SENT, ReadingStatusUtil.FAILED],
    };

    const chips = historyFilterChips(filters, NOW);

    expect(chips.map((chip) => chip.label)).toEqual(['Last 3 months', 'Sent', 'Failed']);
  });

  it('gives the filters left once a chip is removed', () => {
    const filters = { dateFrom: '2026-10-01', dateTo: '2026-10-15', statuses: [ReadingStatusUtil.SENT] };

    const [dateChip, sentChip] = historyFilterChips(filters, NOW);

    expect(dateChip.remainingFilters).toEqual({ statuses: [ReadingStatusUtil.SENT] });
    expect(sentChip.remainingFilters).toEqual({ dateFrom: '2026-10-01', dateTo: '2026-10-15', statuses: [] });
  });

  it('shows a custom range as its days', () => {
    const filters = { dateFrom: '2026-01-10', dateTo: '2026-02-20', statuses: [] };

    expect(historyFilterChips(filters, NOW)[0].label).toBe('10 Jan 2026 – 20 Feb 2026');
  });

  it('shows a range open at one end as from or until a day', () => {
    const fromChip = historyFilterChips({ dateFrom: '2026-01-10', statuses: [] }, NOW);
    const untilChip = historyFilterChips({ dateTo: '2026-02-20', statuses: [] }, NOW);

    expect(fromChip[0].label).toBe('From 10 Jan 2026');
    expect(untilChip[0].label).toBe('Until 20 Feb 2026');
  });

  it('shows no chips without filters', () => {
    expect(historyFilterChips(NO_FILTERS, NOW)).toEqual([]);
  });
});

describe('historyFilterDraft', () => {
  it('picks the preset the url range matches', () => {
    const draft = historyFilterDraft({ dateFrom: '2026-01-01', dateTo: '2026-10-15', statuses: [] }, NOW);

    expect(draft.datePreset).toBe(DatePreset.THIS_YEAR);
  });

  it('picks Custom with its days for any other range', () => {
    const draft = historyFilterDraft({ dateFrom: '2026-01-10', statuses: [ReadingStatusUtil.FAILED] }, NOW);

    expect(draft).toEqual({
      datePreset: DatePreset.CUSTOM,
      customFrom: '2026-01-10',
      customTo: '',
      statuses: [ReadingStatusUtil.FAILED],
    });
  });

  it('picks no preset without a range', () => {
    expect(historyFilterDraft(NO_FILTERS, NOW).datePreset).toBeUndefined();
  });
});

describe('historyFiltersFromDraft', () => {
  it("turns a preset into today's range", () => {
    const draft = { datePreset: DatePreset.THIS_MONTH, customFrom: '2020-01-01', customTo: '', statuses: [] };

    expect(historyFiltersFromDraft(draft, NOW)).toEqual({ dateFrom: '2026-10-01', dateTo: '2026-10-15', statuses: [] });
  });

  it('keeps the custom days that were picked', () => {
    const draft = { datePreset: DatePreset.CUSTOM, customFrom: '', customTo: '2026-02-20', statuses: [] };

    expect(historyFiltersFromDraft(draft, NOW)).toEqual({ dateTo: '2026-02-20', statuses: [] });
  });

  it('drops the custom days when no preset is picked, and orders the statuses', () => {
    const draft = {
      customFrom: '2026-01-10',
      customTo: '2026-02-20',
      statuses: [ReadingStatusUtil.FAILED, ReadingStatusUtil.NOT_SENT],
    };

    expect(historyFiltersFromDraft(draft, NOW)).toEqual({
      statuses: [ReadingStatusUtil.NOT_SENT, ReadingStatusUtil.FAILED],
    });
  });
});
