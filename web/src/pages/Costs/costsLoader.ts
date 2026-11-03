import type { LoaderFunctionArgs } from 'react-router';
import readingService from '@services/readingService/readingService';
import { readDateFilters } from '@utils/historyFilterUtils';

// Every reading with a Cost in the url's day range, and their sum. The same day range as Home's history; no status.
export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const { dateFrom, dateTo } = readDateFilters(searchParams);

  const costs = await readingService.getCosts({ dateFrom, dateTo });

  return { costs };
}
