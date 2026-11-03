import type { ReadingApiModel } from '@app-types/models';
import { Card, CardContent } from '@components/ui/card';
import { costBars } from './costsChartUtils';
import CostsBarChart from './components/CostsBarChart';

type Props = {
  readings: ReadingApiModel[];
};

// Each reading's Cost at its date, on a card. A reading with no Cost gets no bar, and with no bar there is no chart.
function CostsChart({ readings }: Props) {
  const bars = costBars(readings);

  if (bars.length === 0) return null;

  return (
    <Card>
      <CardContent>
        <CostsBarChart bars={bars} />
      </CardContent>
    </Card>
  );
}

export default CostsChart;
