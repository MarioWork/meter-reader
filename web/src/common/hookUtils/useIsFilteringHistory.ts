import { useNavigation } from 'react-router';
import { readDateFilters, readHistoryFilters } from '@utils/historyFilterUtils';
import type { HistoryFilterValues } from '@components/HistoryFilters/types';

function filtersKey(filters: HistoryFilterValues): string {
  return JSON.stringify(filters);
}

type IsFilteringHistoryOptions = {
  // False on a page that filters by day only (Costs), so a status in the next url is ignored there too.
  hasStatusFilter?: boolean;
};

// True while the page loads the readings for new filters. Loading the next page (same filters) or opening another page
// does not count, so only a filter change dims the list.
export function useIsFilteringHistory(
  filters: HistoryFilterValues,
  { hasStatusFilter = true }: IsFilteringHistoryOptions = {},
): boolean {
  const navigation = useNavigation();
  const nextLocation = navigation.location;

  if (navigation.state !== 'loading' || !nextLocation) return false;

  const readFilters = hasStatusFilter ? readHistoryFilters : readDateFilters;
  const nextFilters = readFilters(new URLSearchParams(nextLocation.search));

  return filtersKey(nextFilters) !== filtersKey(filters);
}
