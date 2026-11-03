import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { hasHistoryFilters, readHistoryFilters, withHistoryFilters } from '../historyFilterUtils';
import type { HistoryFilterValues } from '../types';

const NO_FILTERS: HistoryFilterValues = { statuses: [] };

// The history's filters live in the url, so Back, a refresh and a shared link keep them. Each change is a new history
// entry, and Home's loader runs again from the first page. The page keeps its scroll position, and the browser
// cross-fades the old list into the new one where it supports view transitions.
export function useHistoryFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readHistoryFilters(searchParams);
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
    const nextSearchParams = withHistoryFilters(baseSearchParams, makeFilters(readHistoryFilters(baseSearchParams)));

    pendingSearchRef.current = nextSearchParams.toString();
    void setSearchParams(nextSearchParams, { preventScrollReset: true, viewTransition: true });
  };

  const applyFilters = (nextFilters: HistoryFilterValues) => updateFilters(() => nextFilters);

  const clearFilters = () => applyFilters(NO_FILTERS);

  return { filters, isFiltered, applyFilters, updateFilters, clearFilters };
}
