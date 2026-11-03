import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { hasHistoryFilters, readDateFilters, readHistoryFilters, withHistoryFilters } from '@utils/historyFilterUtils';
import type { HistoryFilterValues } from '@components/HistoryFilters/types';

const NO_FILTERS: HistoryFilterValues = { statuses: [] };

type HistoryFiltersOptions = {
  // False on a page that filters by day only (Costs): a status in the url is then ignored.
  hasStatusFilter?: boolean;
};

// The history's filters live in the url, so Back, a refresh and a shared link keep them. Each change is a new history
// entry, and the page's loader runs again from the first page. The page keeps its scroll position, and the browser
// cross-fades the old list into the new one where it supports view transitions.
export function useHistoryFilters({ hasStatusFilter = true }: HistoryFiltersOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const readFilters = hasStatusFilter ? readHistoryFilters : readDateFilters;
  const filters = readFilters(searchParams);
  const isFiltered = hasHistoryFilters(filters);

  // The last change asked for, until the page has caught up with it. A second click while the first is still loading
  // builds on that change, not on the url this render saw, so two quick clicks never undo each other.
  const pendingSearchRef = useRef<string | null>(null);
  const currentSearch = searchParams.toString();

  useEffect(() => {
    pendingSearchRef.current = null;
  }, [currentSearch]);

  const updateFilters = (makeFilters: (currentFilters: HistoryFilterValues) => HistoryFilterValues) => {
    const baseSearchParams = new URLSearchParams(pendingSearchRef.current ?? currentSearch);
    const nextSearchParams = withHistoryFilters(baseSearchParams, makeFilters(readFilters(baseSearchParams)));

    pendingSearchRef.current = nextSearchParams.toString();
    void setSearchParams(nextSearchParams, { preventScrollReset: true, viewTransition: true });
  };

  const applyFilters = (nextFilters: HistoryFilterValues) => updateFilters(() => nextFilters);

  const clearFilters = () => applyFilters(NO_FILTERS);

  return { filters, isFiltered, applyFilters, updateFilters, clearFilters };
}
