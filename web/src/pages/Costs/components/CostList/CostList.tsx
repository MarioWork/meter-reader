import { useId } from 'react';
import type { ReadingApiModel } from '@app-types/models';
import TileCard from '@components/TileCard';
import { CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { useIsWideScreen } from '@hooks/useIsWideScreen';
import CostItems from './components/CostItems';
import CostTable from './components/CostTable';

type Props = {
  readings: ReadingApiModel[];
};

const TITLE = 'Readings';

// The readings behind the chart and the sum, newest first, each with its date, its cost and its bill. It carries the
// same data as the chart, so it is the chart's text alternative too; a reading with no cost is listed but has no
// bar and adds nothing to the total. A phone lists them; a wide screen has the room for a table.
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
          <CostItems readings={readings} titleId={titleId} />
        )}
      </CardContent>
    </TileCard>
  );
}

export default CostList;
