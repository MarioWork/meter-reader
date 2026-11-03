import type { ReadingApiModel } from '@app-types/models';
import { formatIsoDate } from '@utils/dateUtils';

// One bar: a reading with a Cost, at its date.
export type CostBar = {
  readingId: number;
  date: string;
  costCents: number;
};

const DISPLAY_LOCALE = 'en-GB';
// An axis tick, short enough for a phone: "1 Sept 25". The tooltip and the list show the whole date.
const TICK_DATE_FORMAT = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  day: 'numeric',
  month: 'short',
  year: '2-digit',
  timeZone: 'UTC',
});
const START_OF_DAY_UTC = 'T00:00:00.000Z';
const LIST_POINTER = 'Every amount is in the list below.';
const SINGLE_BAR = 1;

function hasCost(reading: ReadingApiModel): reading is ReadingApiModel & { costCents: number } {
  return reading.costCents !== null;
}

// The bars left to right in time: the readings come newest first, the chart reads oldest first. A reading with no
// Cost gets no bar.
export function costBars(readings: ReadingApiModel[]): CostBar[] {
  return readings
    .filter(hasCost)
    .map((reading) => ({ readingId: reading.id, date: reading.date, costCents: reading.costCents }))
    .reverse();
}

export function formatTickDate(isoDate: string): string {
  return TICK_DATE_FORMAT.format(new Date(`${isoDate}${START_OF_DAY_UTC}`));
}

// The chart's text alternative: what it shows, over which days, and where its numbers are. For one bar or more; with
// none there is no chart.
export function costsChartLabel(bars: CostBar[]): string {
  const firstDate = formatIsoDate(bars[0].date);
  const lastDate = formatIsoDate(bars[bars.length - 1].date);

  if (bars.length === SINGLE_BAR) return `Bar chart of 1 cost, on ${firstDate}. ${LIST_POINTER}`;

  return `Bar chart of ${bars.length} costs, from ${firstDate} to ${lastDate}. ${LIST_POINTER}`;
}
