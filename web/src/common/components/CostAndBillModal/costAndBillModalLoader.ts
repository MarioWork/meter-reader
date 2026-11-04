import type { LoaderFunctionArgs } from 'react-router';
import readingService from '@services/readingService/readingService';
import { ReadingParamsSchema } from '@services/readingService/readingService.type';

// The reading fresh from the server, so the form starts from its saved cost and a link to it works on its own.
export async function loader({ params }: LoaderFunctionArgs) {
  const { readingId } = await ReadingParamsSchema.validate(params);

  const reading = await readingService.getReading(readingId);

  return { reading };
}
