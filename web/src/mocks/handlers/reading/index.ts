import addReadingHandler from './addReading.mock.handler';
import deleteReadingHandler from './deleteReading.mock.handler';
import getEmailDefaultsHandler from './getEmailDefaults.mock.handler';
import getReadingHandler from './getReading.mock.handler';
import getReadingEmailHandler from './getReadingEmail.mock.handler';
import getReadingsBackupHandler from './getReadingsBackup.mock.handler';
import getReadingsBackupCsvHandler from './getReadingsBackupCsv.mock.handler';
import getReadingsSpreadsheetHandler from './getReadingsSpreadsheet.mock.handler';
import listReadingsHandler from './listReadings.mock.handler';
import sendReadingHandler from './sendReading.mock.handler';
import updateReadingHandler from './updateReading.mock.handler';

export const readingMockHandlers = (baseUrl: string) => [
  ...listReadingsHandler(baseUrl),
  ...getReadingsSpreadsheetHandler(baseUrl),
  // Before /readings/:id, which would take "backup.json" for an id.
  ...getReadingsBackupHandler(baseUrl),
  ...getReadingsBackupCsvHandler(baseUrl),
  ...addReadingHandler(baseUrl),
  ...deleteReadingHandler(baseUrl),
  ...getEmailDefaultsHandler(baseUrl),
  ...getReadingHandler(baseUrl),
  ...getReadingEmailHandler(baseUrl),
  ...sendReadingHandler(baseUrl),
  ...updateReadingHandler(baseUrl),
];
