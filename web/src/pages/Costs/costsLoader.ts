import type { LoaderFunctionArgs } from 'react-router';
import readingService from '@services/readingService/readingService';
import { readDateFilters } from '@utils/historyFilterUtils';

// Every reading with a Cost or a Bill in the url's day range, and the sum of their costs. The same day range as Home's history; no status.
export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const { dateFrom, dateTo } = readDateFilters(searchParams);

  const costs = await readingService.getCosts({ dateFrom, dateTo });

  return { costs };
}
