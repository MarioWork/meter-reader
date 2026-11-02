import type { LoaderFunctionArgs } from 'react-router';
import readingService from '@services/readingService/readingService';
import { ApiUrlParamsUtil, DEFAULT_FIRST_PAGE, PAGE_SIZE } from '@app-types/utility';

// The page of the history the url asks for, newest first. An empty `?page=` counts as no page.
export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;

  const fields = {
    pagination: { page: searchParams.get(ApiUrlParamsUtil.page) || DEFAULT_FIRST_PAGE, size: PAGE_SIZE },
  };

  const readingsResponse = await readingService.getReadings(fields);

  return { readingsResponse };
}
