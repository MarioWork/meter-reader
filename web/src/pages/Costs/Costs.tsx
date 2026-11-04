import { useRef } from 'react';
import { useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import HistoryFilters from '@components/HistoryFilters';
import { useHistoryFilters } from '@hooks/useHistoryFilters';
import { useIsFilteringHistory } from '@hooks/useIsFilteringHistory';
import { cn } from '@utils/classNameUtils';
import CostList from './components/CostList';
import CostsChart from './components/CostsChart';
import CostsTotal from './components/CostsTotal';
import CostsHeader from './components/CostsHeader';
import NoCosts from './components/NoCosts';
import type { loader } from './costsLoader';

const SUMMARY_LABEL = 'Summary';

// Costs filters by day only.
const FILTERS_OPTIONS = { hasStatusFilter: false };

// What the readings cost: the sum, a bar per reading over time, and the same readings as a list, which is also the
// chart's text alternative. The list also holds the readings with no Cost (a Bill only, or neither), which get no bar and add nothing to the
// sum. Narrowed by the same day range as Home's history, kept in the url, and exported for it. A phone stacks them in
// one narrow column; from `lg`, with room beside the sidebar, the page takes the shell's full column: the total and
// the chart share the top row, the total a third of it and as tall as the chart, its content at the top, and the list
// runs under both, as wide as the two.
function Costs() {
  const { costs } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const { filters, isFiltered, clearFilters } = useHistoryFilters(FILTERS_OPTIONS);
  const isFiltering = useIsFilteringHistory(filters, FILTERS_OPTIONS);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  const hasListedReadings = costs.data.length > 0;
  const costCount = costs.data.filter((reading) => reading.costCents !== null).length;

  // Clear filters goes with the empty result; focus goes to the Filter button instead of the top of the page.
  const clearFiltersFromEmptyResult = () => {
    filterButtonRef.current?.focus();
    clearFilters();
  };

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6 lg:max-w-none lg:px-8">
      <HistoryFilters
        filterButtonRef={filterButtonRef}
        hasStatusFilter={FILTERS_OPTIONS.hasStatusFilter}
        renderHeader={(filterButton) => (
          <CostsHeader range={filters} hasListedReadings={hasListedReadings} filterButton={filterButton} />
        )}
      />
      {/* Dims while new filters load, so the change shows at once. */}
      <div
        aria-busy={isFiltering}
        className={cn(
          'flex flex-col gap-6 motion-safe:transition-opacity motion-safe:duration-200',
          isFiltering && 'opacity-50',
        )}
      >
        {hasListedReadings ? (
          <>
            {/* From lg: the total takes a third of the row and stretches to the chart's height. */}
            <div role="group" aria-label={SUMMARY_LABEL} className="flex flex-col gap-6 lg:grid lg:grid-cols-3">
              <CostsTotal totalCostCents={costs.totalCostCents} costCount={costCount} />
              <CostsChart readings={costs.data} className="min-w-0 lg:col-span-2" />
            </div>
            <CostList readings={costs.data} />
          </>
        ) : (
          <NoCosts isFiltered={isFiltered} onClearFilters={clearFiltersFromEmptyResult} />
        )}
      </div>
    </main>
  );
}

export default Costs;
