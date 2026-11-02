import addReadingHandler from './addReading.mock.handler';
import deleteReadingHandler from './deleteReading.mock.handler';
import getReadingEmailHandler from './getReadingEmail.mock.handler';
import listReadingsHandler from './listReadings.mock.handler';
import sendReadingHandler from './sendReading.mock.handler';

export const readingMockHandlers = (baseUrl: string) => [
  ...listReadingsHandler(baseUrl),
  ...addReadingHandler(baseUrl),
  ...deleteReadingHandler(baseUrl),
  ...getReadingEmailHandler(baseUrl),
  ...sendReadingHandler(baseUrl),
];
