import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@components/ui/chart';
import { formatCost, formatWholeEuros } from '@utils/costUtils';
import { formatIsoDate } from '@utils/dateUtils';
import { barDatesById, costsChartLabel, formatTickDate, type CostBar } from '../costsChartUtils';

type Props = {
  bars: CostBar[];
};

// A bar's corner radii: top left, top right, bottom right, bottom left.
type BarCornerRadii = [number, number, number, number];

// One hovered series in the tooltip, with the bar it belongs to.
type TooltipEntry = { payload?: Partial<CostBar> };

const COST_LABEL = 'Cost';

// One series, so no legend: the page title names it. Its colour is a theme token, stepped for light and dark.
const CHART_CONFIG = {
  costCents: { label: COST_LABEL, color: 'var(--chart-1)' },
} satisfies ChartConfig;

// Thin bars with rounded tops on the baseline, at most 24 px wide, and only horizontal grid lines, kept faint.
const BAR_RADIUS: BarCornerRadii = [4, 4, 0, 0];
const BAR_MAX_WIDTH = 24;
const CHART_MARGIN = { top: 8, left: 0, right: 0 };
const TICK_GAP = 8;
const MIN_TICK_SPACING = 24;
const VALUE_AXIS_WIDTH = 48;

// The hovered bar's date in full, "1 Sept 2025", read off the bar itself: the tooltip's own label is its series name.
function tooltipDate(_label: React.ReactNode, payload: readonly TooltipEntry[]): React.ReactNode {
  const isoDate = payload[0]?.payload?.date;

  if (isoDate === undefined) return null;

  return formatIsoDate(isoDate);
}

// An axis tick, "1 Sept 25", for the bar's reading.
function tickDateFor(datesById: Map<number, string>) {
  return (readingId: number): string => {
    const isoDate = datesById.get(readingId);

    if (isoDate === undefined) return '';

    return formatTickDate(isoDate);
  };
}

// Its cost to the cent, "€38.20", in text colours: the bar carries the colour.
function tooltipCost(costCents: unknown): React.ReactNode {
  return (
    <span className="flex w-full justify-between gap-4">
      <span className="text-muted-foreground">{COST_LABEL}</span>
      <span className="font-medium text-foreground tabular-nums">{formatCost(Number(costCents))}</span>
    </span>
  );
}

// The bars themselves, oldest on the left. A picture of the list below it, which holds the same numbers: screen
// readers get one sentence that says so (role="img"), and the bars take no focus (no accessibility layer), so nothing
// is announced twice. Hovering a bar shows its date and cost. Each bar has its own place, by its reading, so two
// readings of one day are two bars, each with its own tooltip.
function CostsBarChart({ bars }: Props) {
  const datesById = barDatesById(bars);

  return (
    <ChartContainer
      config={CHART_CONFIG}
      role="img"
      aria-label={costsChartLabel(bars)}
      className="aspect-auto h-56 w-full lg:h-80"
    >
      <BarChart data={bars} accessibilityLayer={false} margin={CHART_MARGIN}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="readingId"
          tickLine={false}
          axisLine={false}
          tickMargin={TICK_GAP}
          minTickGap={MIN_TICK_SPACING}
          tickFormatter={tickDateFor(datesById)}
        />
        <YAxis tickLine={false} axisLine={false} width={VALUE_AXIS_WIDTH} tickFormatter={formatWholeEuros} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideIndicator labelFormatter={tooltipDate} formatter={tooltipCost} />}
        />
        <Bar dataKey="costCents" fill="var(--color-costCents)" radius={BAR_RADIUS} maxBarSize={BAR_MAX_WIDTH} />
      </BarChart>
    </ChartContainer>
  );
}

export default CostsBarChart;
