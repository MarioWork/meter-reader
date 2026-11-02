import { redirect, type LoaderFunctionArgs } from 'react-router';
import readingService from '@services/readingService/readingService';
import { ApiUrlParamsUtil, DEFAULT_FIRST_PAGE, PAGE_SIZE } from '@app-types/utility';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';

// The same search with only the page changed to the last one.
function lastPageSearch(searchParams: URLSearchParams, totalResultNumber: number): string {
  const lastPage = Math.ceil(totalResultNumber / Number(PAGE_SIZE));
  const lastPageParams = new URLSearchParams(searchParams);

  lastPageParams.set(ApiUrlParamsUtil.page, String(lastPage));

  return lastPageParams.toString();
}

// The page of the history the url asks for, newest first. An empty `?page=` counts as no page. A page past the end
// (its last reading was just deleted) moves to the last page that still has readings.
export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;

  const fields = {
    pagination: { page: searchParams.get(ApiUrlParamsUtil.page) || DEFAULT_FIRST_PAGE, size: PAGE_SIZE },
  };

  const readingsResponse = await readingService.getReadings(fields);

  const isPageEmpty = readingsResponse.data.length === 0;
  const hasReadings = readingsResponse.totalResultNumber > 0;

  if (isPageEmpty && hasReadings) {
    return redirect(`${BASE_ROUTES_PATHS.HOME}?${lastPageSearch(searchParams, readingsResponse.totalResultNumber)}`);
  }

  return { readingsResponse };
}
