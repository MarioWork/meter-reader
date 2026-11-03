import axios from 'axios';

const BASE_BACKUP_URL = '/backup';
const JSON_BACKUP_SEGMENT = 'readings.json';
const CSV_BACKUP_SEGMENT = 'readings.csv';

function backupUrl(segment: string): string {
  return `${axios.defaults.baseURL ?? ''}${BASE_BACKUP_URL}/${segment}`;
}

// Plain downloads: the browser follows these links itself, with the session cookie, so no axios call is involved.
export default {
  getBackupJsonUrl: (): string => backupUrl(JSON_BACKUP_SEGMENT),
  getBackupCsvUrl: (): string => backupUrl(CSV_BACKUP_SEGMENT),
};
