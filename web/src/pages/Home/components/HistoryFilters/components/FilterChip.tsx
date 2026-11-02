import { XIcon } from 'lucide-react';
import { Button } from '@components/ui/button';
import type { HistoryFilterChip } from '../../../types';

type Props = {
  chip: HistoryFilterChip;
  onRemove: (chip: HistoryFilterChip) => void;
};

const REMOVE_PREFIX = 'Remove filter:';

// One active filter. Its name starts with what it does and ends with the text it shows ("Remove filter: Sent"), so
// voice control finds it by what is on screen.
function FilterChip({ chip, onRemove }: Props) {
  return (
    <li>
      <Button
        variant="secondary"
        size="sm"
        aria-label={`${REMOVE_PREFIX} ${chip.label}`}
        onClick={() => onRemove(chip)}
      >
        {chip.label}
        <XIcon data-icon="inline-end" aria-hidden />
      </Button>
    </li>
  );
}

export default FilterChip;
