// The download headers the API answers a backup with.
export const BACKUP_JSON_FILE_NAME = 'meter-readings-2026-11-03.json';
export const BACKUP_CSV_FILE_NAME = 'meter-readings-2026-11-03.csv';
export const CSV_CONTENT_TYPE = 'text/csv; charset=utf-8';

export function attachment(fileName: string): string {
  return `attachment; filename="${fileName}"`;
}
