import { useState } from 'react';
import { ListFilterIcon } from 'lucide-react';
import { Button } from '@components/ui/button';
import { useIsWideScreen } from '@hooks/useIsWideScreen';
import { historyFilterChips } from '../../historyFilterUtils';
import { useHistoryFilters } from '../../hooks/useHistoryFilters';
import type { HistoryFilterChip, HistoryFilterValues } from '../../types';
import FilterBar from './components/FilterBar';
import FilterChips from './components/FilterChips';
import FilterSheet from './components/FilterSheet';

type Props = {
  // Home focuses it too, once Clear filters has gone with the empty result.
  filterButtonRef: React.RefObject<HTMLButtonElement | null>;
};

const FILTER_LABEL = 'Filter';

// A wide screen has the room to show every filter at once, in a bar under the title. A phone gets the Filter button,
// which opens the filter sheet, and the active filters as chips beside it. A removed chip takes focus with it, so
// focus goes to the Filter button first instead of dropping to the top of the page.
function HistoryFilters({ filterButtonRef }: Props) {
  const { filters, applyFilters, updateFilters } = useHistoryFilters();
  const isWideScreen = useIsWideScreen();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const chips = historyFilterChips(filters);
  const hasChips = chips.length > 0;

  const applyFromSheet = (nextFilters: HistoryFilterValues) => {
    setIsSheetOpen(false);
    applyFilters(nextFilters);
  };

  const removeChip = (chip: HistoryFilterChip) => {
    filterButtonRef.current?.focus();
    applyFilters(chip.remainingFilters);
  };

  if (isWideScreen) return <FilterBar filters={filters} onApply={applyFilters} onUpdate={updateFilters} />;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button ref={filterButtonRef} variant="outline" aria-haspopup="dialog" onClick={() => setIsSheetOpen(true)}>
        <ListFilterIcon data-icon="inline-start" aria-hidden />
        {FILTER_LABEL}
      </Button>
      {hasChips && <FilterChips chips={chips} onRemove={removeChip} />}
      <FilterSheet isOpen={isSheetOpen} filters={filters} onOpenChange={setIsSheetOpen} onApply={applyFromSheet} />
    </div>
  );
}

export default HistoryFilters;
