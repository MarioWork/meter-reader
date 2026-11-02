import addReadingHandler from './addReading.mock.handler';
import listReadingsHandler from './listReadings.mock.handler';

export const readingMockHandlers = (baseUrl: string) => [
  ...listReadingsHandler(baseUrl),
  ...addReadingHandler(baseUrl),
];
