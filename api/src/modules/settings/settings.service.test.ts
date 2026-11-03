import { ConflictError } from '../../lib/httpErrors.ts';
import { settingsRepository } from './settings.repository.ts';
import { getMessageTemplates, getProviderEmail, requireProviderEmail } from './settings.service.ts';

vi.mock('./settings.repository.ts', () => ({
  settingsRepository: { find: vi.fn(), save: vi.fn() },
}));

const PROVIDER_EMAIL = 'readings@water-provider.example';
const SAVED_ROW = { providerEmail: PROVIDER_EMAIL, subjectTemplate: 'Meter {date}', bodyTemplate: 'Reading {reading}' };

describe('getProviderEmail', () => {
  it('answers null when Settings were never saved', async () => {
    vi.mocked(settingsRepository.find).mockResolvedValueOnce(undefined);

    expect(await getProviderEmail()).toBeNull();
  });

  it('answers the saved address when one was saved', async () => {
    vi.mocked(settingsRepository.find).mockResolvedValueOnce(SAVED_ROW);

    expect(await getProviderEmail()).toBe(PROVIDER_EMAIL);
  });
});

describe('requireProviderEmail', () => {
  it('answers the saved address when one was saved', async () => {
    vi.mocked(settingsRepository.find).mockResolvedValueOnce(SAVED_ROW);

    expect(await requireProviderEmail()).toBe(PROVIDER_EMAIL);
  });

  it('throws a ConflictError PROVIDER_EMAIL_NOT_SET when the row has no address', async () => {
    vi.mocked(settingsRepository.find).mockResolvedValueOnce({ ...SAVED_ROW, providerEmail: null });

    const requiring = requireProviderEmail();

    await expect(requiring).rejects.toBeInstanceOf(ConflictError);
    await expect(requiring).rejects.toMatchObject({ code: 'PROVIDER_EMAIL_NOT_SET' });
  });
});

describe('getMessageTemplates', () => {
  it("answers a fresh install's templates when Settings were never saved", async () => {
    vi.mocked(settingsRepository.find).mockResolvedValueOnce(undefined);

    expect(await getMessageTemplates()).toEqual({ subject: 'Leitura {date}', body: 'Leitura - {reading} - {date}' });
  });

  it('answers the saved templates when they were saved', async () => {
    vi.mocked(settingsRepository.find).mockResolvedValueOnce(SAVED_ROW);

    expect(await getMessageTemplates()).toEqual({ subject: 'Meter {date}', body: 'Reading {reading}' });
  });
});
