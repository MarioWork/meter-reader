import getBackupHandler from './getBackup.mock.handler';
import getBackupCsvHandler from './getBackupCsv.mock.handler';

export const backupMockHandlers = (baseUrl: string) => [...getBackupHandler(baseUrl), ...getBackupCsvHandler(baseUrl)];
