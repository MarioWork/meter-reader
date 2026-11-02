import { useSearchParams } from 'react-router';
import { hasHistoryFilters, readHistoryFilters, withHistoryFilters } from '../historyFilterUtils';
import type { HistoryFilterValues } from '../types';

const NO_FILTERS: HistoryFilterValues = { statuses: [] };

// The history's filters live in the url, so Back, a refresh and a shared link keep them. Each change is a new history
// entry, and Home's loader runs again from the first page.
export function useHistoryFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readHistoryFilters(searchParams);
  const isFiltered = hasHistoryFilters(filters);

  const applyFilters = (nextFilters: HistoryFilterValues) => {
    void setSearchParams((currentSearchParams) => withHistoryFilters(currentSearchParams, nextFilters));
  };

  const clearFilters = () => applyFilters(NO_FILTERS);

  return { filters, isFiltered, applyFilters, clearFilters };
}
