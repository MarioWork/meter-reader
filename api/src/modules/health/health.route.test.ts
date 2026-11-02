import { buildApp, type App } from '../../app.ts';
import { resetAuthTables, setUpWithPassword, withSession } from '../auth/auth.fixture.ts';

let app: App;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

describe('GET /health', () => {
  it('answers ok when the process is up', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});

describe('GET /ready', () => {
  it('answers ok when the database answers', async () => {
    const response = await app.inject({ method: 'GET', url: '/ready' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});

describe('GET /<unknown route>', () => {
  it('returns 404 with the NOT_FOUND envelope when no route matches and the caller is signed in', async () => {
    await resetAuthTables();
    const token = await setUpWithPassword(app);

    const response = await app.inject({ method: 'GET', url: '/nope', ...withSession(token) });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ code: 'NOT_FOUND', message: 'Route GET /nope not found' });
  });
});
