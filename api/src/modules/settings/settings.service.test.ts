import { ConflictError } from '../../lib/httpErrors.ts';
import { settingsRepository } from './settings.repository.ts';
import { getProviderEmail, requireProviderEmail } from './settings.service.ts';

vi.mock('./settings.repository.ts', () => ({
  settingsRepository: { find: vi.fn(), saveProviderEmail: vi.fn() },
}));

const PROVIDER_EMAIL = 'readings@water-provider.example';

describe('getProviderEmail', () => {
  it('answers null when Settings were never saved', async () => {
    vi.mocked(settingsRepository.find).mockResolvedValueOnce(undefined);

    expect(await getProviderEmail()).toBeNull();
  });

  it('answers the saved address when one was saved', async () => {
    vi.mocked(settingsRepository.find).mockResolvedValueOnce({ providerEmail: PROVIDER_EMAIL });

    expect(await getProviderEmail()).toBe(PROVIDER_EMAIL);
  });
});

describe('requireProviderEmail', () => {
  it('answers the saved address when one was saved', async () => {
    vi.mocked(settingsRepository.find).mockResolvedValueOnce({ providerEmail: PROVIDER_EMAIL });

    expect(await requireProviderEmail()).toBe(PROVIDER_EMAIL);
  });

  it('throws a ConflictError PROVIDER_EMAIL_NOT_SET when the row has no address', async () => {
    vi.mocked(settingsRepository.find).mockResolvedValueOnce({ providerEmail: null });

    const requiring = requireProviderEmail();

    await expect(requiring).rejects.toBeInstanceOf(ConflictError);
    await expect(requiring).rejects.toMatchObject({ code: 'PROVIDER_EMAIL_NOT_SET' });
  });
});
