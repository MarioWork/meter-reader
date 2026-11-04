import { redirect, type LoaderFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import { ReadingParamsSchema } from '@services/readingService/readingService.type';
import { BASE_ROUTES_PATHS, READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import { withSearchOf } from '@utils/urlSearchUtils';

// Where the redirect goes: the reading's page, or Home when the old link names no reading at all.
async function newDetailsPath(params: LoaderFunctionArgs['params']): Promise<string> {
  try {
    const { readingId } = await ReadingParamsSchema.validate(params);

    return READING_ROUTES_PATHS.details(String(readingId));
  } catch (error) {
    if (error instanceof ValidationError) return BASE_ROUTES_PATHS.HOME;

    throw error;
  }
}

// The details were a modal over Home at /home/readings/:readingId before they had a page. A link kept from then goes
// to the reading's page, with the same search, so "← Readings" still finds the same history.
export async function loader({ params, request }: LoaderFunctionArgs) {
  return redirect(withSearchOf(request.url, await newDetailsPath(params)));
}
