import { prisma } from '../../lib/prisma.ts';
import { mailRepository, type MailConnection } from './mail.repository.ts';

const ACCESS_TOKEN_EXPIRES_AT = new Date('2026-11-02T18:00:00.000Z');

function connection(name: string): MailConnection {
  return {
    refreshToken: `${name}-refresh-token`,
    accessToken: `${name}-access-token`,
    accessTokenExpiresAt: ACCESS_TOKEN_EXPIRES_AT,
  };
}

beforeEach(async () => {
  await prisma.mailConnection.deleteMany();
});

describe('replaceConnection', () => {
  it('keeps only the newest connection', async () => {
    await mailRepository.replaceConnection(connection('old'));

    await mailRepository.replaceConnection(connection('new'));

    expect(await prisma.mailConnection.count()).toBe(1);
    expect(await mailRepository.findConnection()).toEqual(connection('new'));
  });
});

describe('updateConnection', () => {
  it('saves the refreshed tokens over the connection the refresh started from', async () => {
    await mailRepository.replaceConnection(connection('old'));

    await mailRepository.updateConnection('old-refresh-token', connection('refreshed'));

    expect(await mailRepository.findConnection()).toEqual(connection('refreshed'));
  });

  it('leaves a connection made since the refresh started alone', async () => {
    await mailRepository.replaceConnection(connection('reconnected'));

    await mailRepository.updateConnection('old-refresh-token', connection('refreshed'));

    expect(await mailRepository.findConnection()).toEqual(connection('reconnected'));
  });
});

describe('deleteConnection', () => {
  it('removes the refused connection', async () => {
    await mailRepository.replaceConnection(connection('refused'));

    await mailRepository.deleteConnection('refused-refresh-token');

    expect(await mailRepository.hasConnection()).toBe(false);
  });

  it('leaves a connection made since the refusal alone', async () => {
    await mailRepository.replaceConnection(connection('reconnected'));

    await mailRepository.deleteConnection('refused-refresh-token');

    expect(await mailRepository.hasConnection()).toBe(true);
  });
});
