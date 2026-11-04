import { useId, useState } from 'react';
import { ListFilterIcon } from 'lucide-react';
import Tile from '@components/Tile';
import { cn } from '@utils/classNameUtils';
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
  // The page's title and actions, given the phone's Filter button to put first among its actions (null on a wide
  // screen, which shows every filter instead). A wide screen shows the header at the top of the filters tile.
  renderHeader: (filterButton: React.ReactNode) => React.ReactNode;
  // Stays in view while the list scrolls under it (Home): under the phone's header, at the top on a wide screen.
  isSticky?: boolean;
};

const FILTER_LABEL = 'Filter';
// Pinned just under the phone's 56 px header, or near the top of a wide screen, over the list (z-20, under the
// header's z-30). index.css keeps room for it when a focused element scrolls into view (data-sticky-filters).
const STICKY_CLASS = 'sticky top-18 z-20 shadow-sm sm:top-4';

// A wide screen has the room to show every filter at once, in one tile under the page's title and actions. A phone
// gets the same tile with a Filter icon button among the title's actions, which opens the filter sheet, and the
// active filters as chips under the title. A removed chip takes focus with it, so
// focus goes to the Filter button first instead of dropping to the top of the page.
function HistoryFilters({ filterButtonRef, hasStatusFilter = true, renderHeader, isSticky = false }: Props) {
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
      <Tile data-sticky-filters={isSticky || undefined} className={cn('flex flex-col gap-3', isSticky && STICKY_CLASS)}>
        {renderHeader(null)}
        <FilterBar
          filters={filters}
          hasStatusFilter={hasStatusFilter}
          onApply={applyFilters}
          onUpdate={updateFilters}
        />
      </Tile>
    );
  }

  // An icon alone, like Export beside it; 32 px square, over the 24 px minimum target.
  const filterButton = (
    <Button
      ref={filterButtonRef}
      variant="outline"
      size="icon"
      aria-label={FILTER_LABEL}
      aria-haspopup="dialog"
      onClick={() => setIsSheetOpen(true)}
    >
      <ListFilterIcon aria-hidden />
    </Button>
  );

  return (
    <>
      <Tile data-sticky-filters={isSticky || undefined} className={cn('flex flex-col gap-3', isSticky && STICKY_CLASS)}>
        {renderHeader(filterButton)}
        {hasChips && <FilterChips chips={chips} onRemove={removeChip} />}
      </Tile>
      <FilterSheet isOpen={isSheetOpen} formId={formId} onOpenChange={setIsSheetOpen}>
        <FilterForm id={formId} filters={filters} hasStatusFilter={hasStatusFilter} onApply={applyFromSheet} />
      </FilterSheet>
    </>
  );
}

export default HistoryFilters;
