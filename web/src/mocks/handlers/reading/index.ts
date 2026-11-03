import addReadingHandler from './addReading.mock.handler';
import deleteReadingHandler from './deleteReading.mock.handler';
import getEmailDefaultsHandler from './getEmailDefaults.mock.handler';
import getReadingHandler from './getReading.mock.handler';
import getReadingEmailHandler from './getReadingEmail.mock.handler';
import listReadingsHandler from './listReadings.mock.handler';
import sendReadingHandler from './sendReading.mock.handler';

export const readingMockHandlers = (baseUrl: string) => [
  ...listReadingsHandler(baseUrl),
  ...addReadingHandler(baseUrl),
  ...deleteReadingHandler(baseUrl),
  ...getEmailDefaultsHandler(baseUrl),
  ...getReadingHandler(baseUrl),
  ...getReadingEmailHandler(baseUrl),
  ...sendReadingHandler(baseUrl),
];
