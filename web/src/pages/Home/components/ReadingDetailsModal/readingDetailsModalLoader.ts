import type { LoaderFunctionArgs } from 'react-router';
import readingService from '@services/readingService/readingService';
import { ReadingParamsSchema } from '@services/readingService/readingService.type';

// The reading fresh from the server, so a link to it works on its own, whatever page of the history is loaded.
export async function loader({ params }: LoaderFunctionArgs) {
  const { readingId } = await ReadingParamsSchema.validate(params);

  const reading = await readingService.getReading(readingId);

  return { reading };
}
