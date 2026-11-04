import { useId } from 'react';
import type { ReadingApiModel } from '@app-types/models';
import TileCard from '@components/TileCard';
import { CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { useIsWideScreen } from '@hooks/useIsWideScreen';
import CostListItem from './components/CostListItem';
import CostTable from './components/CostTable';

type Props = {
  readings: ReadingApiModel[];
};

const TITLE = 'Readings with a cost or a bill';

// The readings behind the chart and the sum, newest first, each with its date, its cost and its bill. It carries the
// same data as the chart, so it is the chart's text alternative too; a reading with only a bill is listed but has no
// bar. A phone lists them; a wide screen has the room for a compact table.
function CostList({ readings }: Props) {
  const titleId = useId();
  const isWideScreen = useIsWideScreen();

  return (
    <TileCard>
      <CardHeader>
        <CardTitle>
          <h2 id={titleId}>{TITLE}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isWideScreen ? (
          <CostTable readings={readings} titleId={titleId} />
        ) : (
          <ul aria-labelledby={titleId} className="flex flex-col divide-y divide-border">
            {readings.map((reading) => (
              <CostListItem key={reading.id} reading={reading} />
            ))}
          </ul>
        )}
      </CardContent>
    </TileCard>
  );
}

export default CostList;
