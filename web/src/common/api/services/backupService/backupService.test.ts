import { TEST_BASE_API_URL } from '@mocks/server';
import backupService from './backupService';

describe('getBackupJsonUrl', () => {
  it('points at the JSON backup under the API base url', () => {
    expect(backupService.getBackupJsonUrl()).toBe(`${TEST_BASE_API_URL}/backup/readings.json`);
  });
});

describe('getBackupCsvUrl', () => {
  it('points at the CSV backup under the API base url', () => {
    expect(backupService.getBackupCsvUrl()).toBe(`${TEST_BASE_API_URL}/backup/readings.csv`);
  });
});
