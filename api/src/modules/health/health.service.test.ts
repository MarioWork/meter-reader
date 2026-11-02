import { ServiceUnavailableError } from '../../lib/httpErrors.ts';
import { healthRepository } from './health.repository.ts';
import { getReadiness } from './health.service.ts';

vi.mock('./health.repository.ts', () => ({
  healthRepository: { isReachable: vi.fn() },
}));

describe('getReadiness', () => {
  it('returns ok when the database is reachable', async () => {
    vi.mocked(healthRepository.isReachable).mockResolvedValueOnce(true);

    const readiness = await getReadiness();

    expect(readiness).toEqual({ status: 'ok' });
  });

  it('throws ServiceUnavailableError with code NOT_READY when the database is not reachable', async () => {
    vi.mocked(healthRepository.isReachable).mockResolvedValueOnce(false);

    const readiness = getReadiness();

    await expect(readiness).rejects.toBeInstanceOf(ServiceUnavailableError);
    await expect(readiness).rejects.toMatchObject({ code: 'NOT_READY', message: 'Database is not reachable' });
  });
});
