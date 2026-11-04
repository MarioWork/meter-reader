import type { LoaderFunctionArgs } from 'react-router';
import readingService from '@services/readingService/readingService';
import { ReadingParamsSchema } from '@services/readingService/readingService.type';

// The preview comes from the server, so it is exactly what the send will email.
export async function loader({ params }: LoaderFunctionArgs) {
  const { readingId } = await ReadingParamsSchema.validate(params);

  const readingEmail = await readingService.getReadingEmail(readingId);

  return { readingEmail };
}
