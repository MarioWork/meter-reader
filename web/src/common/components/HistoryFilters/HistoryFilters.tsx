import { useId, useState } from 'react';
import { ListFilterIcon } from 'lucide-react';
import Tile from '@components/Tile';
import { Button } from '@components/ui/button';
import { useIsWideScreen } from '@hooks/useIsWideScreen';
import { historyFilterChips } from '@utils/historyFilterUtils';
import { useHistoryFilters } from '@hooks/useHistoryFilters';
import type { HistoryFilterChip, HistoryFilterValues } from './types';
import FilterBar from './components/FilterBar';
import FilterChips from './components/FilterChips';
import FilterForm from './components/FilterForm';
import FilterSheet from './components/FilterSheet';

type Props = {
  // The page focuses it too, once Clear filters has gone with the empty result.
  filterButtonRef: React.RefObject<HTMLButtonElement | null>;
  // False on a page that filters by day only (Costs): no status choices, and no status in the url.
  hasStatusFilter?: boolean;
  // The page's title and actions. A wide screen shows them at the top of the filters tile; a phone, above the
  // Filter button.
  header?: React.ReactNode;
};

const FILTER_LABEL = 'Filter';

// A wide screen has the room to show every filter at once, in one tile under the page's title and actions. A phone gets the Filter button,
// which opens the filter sheet, and the active filters as chips beside it. A removed chip takes focus with it, so
// focus goes to the Filter button first instead of dropping to the top of the page.
function HistoryFilters({ filterButtonRef, hasStatusFilter = true, header }: Props) {
  const { filters, applyFilters, updateFilters } = useHistoryFilters({ hasStatusFilter });
  const isWideScreen = useIsWideScreen();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const formId = useId();
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

  if (isWideScreen) {
    return (
      <Tile className="flex flex-col gap-3">
        {header}
        <FilterBar
          filters={filters}
          hasStatusFilter={hasStatusFilter}
          onApply={applyFilters}
          onUpdate={updateFilters}
        />
      </Tile>
    );
  }

  return (
    <>
      {header}
      <div className="flex flex-wrap items-center gap-2">
        <Button ref={filterButtonRef} variant="outline" aria-haspopup="dialog" onClick={() => setIsSheetOpen(true)}>
          <ListFilterIcon data-icon="inline-start" aria-hidden />
          {FILTER_LABEL}
        </Button>
        {hasChips && <FilterChips chips={chips} onRemove={removeChip} />}
        <FilterSheet isOpen={isSheetOpen} formId={formId} onOpenChange={setIsSheetOpen}>
          <FilterForm id={formId} filters={filters} hasStatusFilter={hasStatusFilter} onApply={applyFromSheet} />
        </FilterSheet>
      </div>
    </>
  );
}

export default HistoryFilters;
