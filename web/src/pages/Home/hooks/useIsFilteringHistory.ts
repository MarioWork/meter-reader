import { useNavigation } from 'react-router';
import { readHistoryFilters } from '../historyFilterUtils';
import type { HistoryFilterValues } from '../types';

function filtersKey(filters: HistoryFilterValues): string {
  return JSON.stringify(filters);
}

// True while Home loads the readings for new filters. Loading the next page (same filters) or opening another page
// does not count, so only a filter change dims the list.
export function useIsFilteringHistory(filters: HistoryFilterValues): boolean {
  const navigation = useNavigation();
  const nextLocation = navigation.location;

  if (navigation.state !== 'loading' || !nextLocation) return false;

  const nextFilters = readHistoryFilters(new URLSearchParams(nextLocation.search));

  return filtersKey(nextFilters) !== filtersKey(filters);
}
