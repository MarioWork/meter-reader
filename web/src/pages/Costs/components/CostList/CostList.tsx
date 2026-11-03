import { useId } from 'react';
import type { ReadingApiModel } from '@app-types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import CostListItem from './components/CostListItem';

type Props = {
  readings: ReadingApiModel[];
};

const TITLE = 'Readings with a cost';

// The readings behind the chart and the sum, newest first, each with its date and cost. It carries the same data as
// the chart, so it is the chart's text alternative too.
function CostList({ readings }: Props) {
  const titleId = useId();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 id={titleId}>{TITLE}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul aria-labelledby={titleId} className="flex flex-col divide-y divide-border">
          {readings.map((reading) => (
            <CostListItem key={reading.id} reading={reading} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default CostList;
