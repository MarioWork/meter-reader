import { createContext, use } from 'react';
import type { ReadingApiModel } from '@app-types/models';

// The loaded reading, for every section of its page: provided once by ReadingContent, so it is never handed down
// through the layouts and the cards.
export const ReadingContext = createContext<ReadingApiModel | null>(null);

const MISSING_PROVIDER_MESSAGE = 'useReading is called outside ReadingContent';

// The reading the page shows. Only ever called under ReadingContent, which has it loaded.
export function useReading(): ReadingApiModel {
  const reading = use(ReadingContext);

  if (!reading) throw new Error(MISSING_PROVIDER_MESSAGE);

  return reading;
}
