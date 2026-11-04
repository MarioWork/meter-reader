import type { LoaderFunctionArgs, Params } from 'react-router';
import { ValidationError } from 'yup';
import readingService from '@services/readingService/readingService';
import { ReadingParamsSchema } from '@services/readingService/readingService.type';
import type { ReadingDetailsApiModel, ReadingId } from '@app-types/models';

// The reading's id from the url, or null when the url names none ("/readings/abc").
async function readingIdIn(params: Params): Promise<ReadingId | null> {
  try {
    const { readingId } = await ReadingParamsSchema.validate(params);

    return readingId;
  } catch (error) {
    if (error instanceof ValidationError) return null;

    throw error;
  }
}

// The reading, or null when the url names none. A read the API refuses (a deleted reading's 404 included) rejects,
// and the page's failure state sorts it out.
async function findReading(params: Params): Promise<ReadingDetailsApiModel | null> {
  const readingId = await readingIdIn(params);

  if (readingId === null) return null;

  return readingService.getReading(readingId);
}

// The reading fresh from the server, so a link to it works on its own. Not awaited: the page opens at once and shows
// where everything goes while the reading loads.
export function loader({ params }: LoaderFunctionArgs) {
  const reading = findReading(params);

  // The page's <Await> still gets the rejection and shows its failure state; this only marks the promise handled, so
  // a load the page no longer waits for (left behind by a later visit or revalidation) is no unhandled rejection.
  reading.catch(() => undefined);

  return { reading };
}
