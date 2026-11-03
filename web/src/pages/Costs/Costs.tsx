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
import ExportCostsLink from './components/ExportCostsLink';
import NoCosts from './components/NoCosts';
import type { loader } from './costsLoader';

const PAGE_TITLE = 'Water Readings Costs';

// Costs filters by day only.
const FILTERS_OPTIONS = { hasStatusFilter: false };

// What the readings cost: the sum, a bar per reading over time, and the same readings as a list, which is also the
// chart's text alternative. The list also holds the readings with only a Bill, which get no bar and add nothing to the
// sum. Narrowed by the same day range as Home's history, kept in the url, and exported for it.
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
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{PAGE_TITLE}</h1>
        {/* Only while readings are listed: an empty page has nothing to export. */}
        {hasListedReadings && <ExportCostsLink range={filters} />}
      </div>
      <HistoryFilters filterButtonRef={filterButtonRef} hasStatusFilter={FILTERS_OPTIONS.hasStatusFilter} />
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
            <CostsTotal totalCostCents={costs.totalCostCents} costCount={costCount} />
            <CostsChart readings={costs.data} />
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
