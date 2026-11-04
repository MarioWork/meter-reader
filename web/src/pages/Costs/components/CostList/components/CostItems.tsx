import type { ReadingApiModel } from '@app-types/models';
import CostListItem from './CostListItem';

type Props = {
  readings: ReadingApiModel[];
  // The card's title, which names the list.
  titleId: string;
};

// A phone's list: one row per reading, divided by a line.
function CostItems({ readings, titleId }: Props) {
  return (
    <ul aria-labelledby={titleId} className="flex flex-col divide-y divide-border">
      {readings.map((reading) => (
        <CostListItem key={reading.id} reading={reading} />
      ))}
    </ul>
  );
}

export default CostItems;
