import { backupRepository, type BackupReadingRow } from './backup.repository.ts';
import { getBackup, getBackupCsv } from './backup.service.ts';

vi.mock('./backup.repository.ts', () => ({ backupRepository: { findReadings: vi.fn() } }));

const NOW = new Date('2026-11-03T21:15:00.000Z');

function createRow(overrides?: Partial<BackupReadingRow>): BackupReadingRow {
  return {
    id: 1,
    digits: '00123',
    date: new Date('2026-10-31T00:00:00.000Z'),
    status: 'NOT_SENT',
    sentAt: null,
    sentFrom: null,
    sentTo: null,
    sentSubject: null,
    sentBody: null,
    sentWithPhoto: null,
    photo: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getBackup', () => {
  it('names the file after the day it was made and dates it now', async () => {
    vi.mocked(backupRepository.findReadings).mockResolvedValueOnce([]);

    const backup = await getBackup();

    expect(backup.fileName).toBe('meter-readings-2026-11-03.json');
    expect(backup.content.exportedAt).toBe(NOW.toISOString());
  });

  it('answers no sent email when only part of it was kept', async () => {
    vi.mocked(backupRepository.findReadings).mockResolvedValueOnce([
      createRow({ status: 'SENT', sentAt: NOW, sentTo: 'readings@water-provider.example' }),
    ]);

    const backup = await getBackup();

    expect(backup.content.readings[0]?.sentEmail).toBeNull();
  });

  it('keeps a sent email with no From when MAIL_FROM was not set when it went out', async () => {
    vi.mocked(backupRepository.findReadings).mockResolvedValueOnce([
      createRow({
        status: 'SENT',
        sentAt: NOW,
        sentTo: 'readings@water-provider.example',
        sentSubject: 'Water meter reading',
        sentBody: 'Reading: 00123',
        sentWithPhoto: false,
      }),
    ]);

    const backup = await getBackup();

    expect(backup.content.readings[0]?.sentEmail).toEqual({
      from: null,
      to: 'readings@water-provider.example',
      subject: 'Water meter reading',
      body: 'Reading: 00123',
      hasPhoto: false,
    });
  });
});

describe('getBackupCsv', () => {
  it('names the file after the day it was made', async () => {
    vi.mocked(backupRepository.findReadings).mockResolvedValueOnce([]);

    const backup = await getBackupCsv();

    expect(backup.fileName).toBe('meter-readings-2026-11-03.csv');
  });
});
