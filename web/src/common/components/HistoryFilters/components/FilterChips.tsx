import type { HistoryFilterChip } from '../types';
import FilterChip from './FilterChip';

type Props = {
  chips: HistoryFilterChip[];
  onRemove: (chip: HistoryFilterChip) => void;
};

const LIST_LABEL = 'Active filters';

// Each active filter as a chip; pressing it removes that filter.
function FilterChips({ chips, onRemove }: Props) {
  return (
    <ul aria-label={LIST_LABEL} className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <FilterChip key={chip.id} chip={chip} onRemove={onRemove} />
      ))}
    </ul>
  );
}

export default FilterChips;
