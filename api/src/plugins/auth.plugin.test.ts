import { buildApp, type App } from '../app.ts';
import { resetAuthTables, setUpWithPassword, withSession } from '../modules/auth/auth.fixture.ts';

// Routes anyone may call without a session (ADR 0002); every other route must answer 401.
const PUBLIC_ROUTES = new Set([
  'GET /health',
  'GET /ready',
  'GET /auth/status',
  'POST /auth/setup/options',
  'POST /auth/setup',
  'POST /auth/login/password',
  'POST /auth/login/options',
  'POST /auth/login/passkey',
  'POST /auth/logout',
]);
// A route only this test adds, standing in for every locked route the app will have.
const PROBE_URL = '/locked-probe';
const OTHER_ORIGIN = 'https://evil.example';

type OpenApiDocument = { paths?: Record<string, Record<string, unknown>> };

let app: App;

// Every documented route as "METHOD /path", from the OpenAPI document the zod schemas build.
function documentedRoutes(): string[] {
  const document = app.swagger() as OpenApiDocument;

  return Object.entries(document.paths ?? {}).flatMap(([path, operations]) =>
    Object.keys(operations).map((method) => `${method.toUpperCase()} ${path}`),
  );
}

beforeAll(async () => {
  app = await buildApp();
  app.get(PROBE_URL, async () => ({ isOpen: true }));
  app.post(PROBE_URL, async () => ({ isOpen: true }));
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetAuthTables();
});

describe('auth plugin', () => {
  it('answers 401 UNAUTHORIZED on every route but the public ones when there is no session', async () => {
    const lockedRoutes = documentedRoutes().filter((route) => !PUBLIC_ROUTES.has(route));

    const answers = await Promise.all(
      [...lockedRoutes, `GET ${PROBE_URL}`].map(async (route) => {
        const [method = 'GET', url = '/'] = route.split(' ');
        const response = await app.inject({ method: method as 'GET', url });

        return { route, statusCode: response.statusCode, code: response.json<{ code?: string }>().code };
      }),
    );

    expect(answers.every((answer) => answer.statusCode === 401 && answer.code === 'UNAUTHORIZED')).toBe(true);
  });

  it('lists only documented routes as public when the OpenAPI document is built', () => {
    const documented = new Set(documentedRoutes());

    expect([...PUBLIC_ROUTES].filter((route) => !documented.has(route))).toEqual([]);
  });

  it('answers 401 on a route that does not exist when there is no session', async () => {
    const response = await app.inject({ method: 'GET', url: '/nope' });

    expect(response.statusCode).toBe(401);
  });

  it('lets a locked route answer when the request has a session', async () => {
    const token = await setUpWithPassword(app);

    const response = await app.inject({ method: 'GET', url: PROBE_URL, ...withSession(token) });

    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('answers 403 CROSS_SITE_REQUEST when another site makes a write, even with a session', async () => {
    const token = await setUpWithPassword(app);

    const response = await app.inject({
      method: 'POST',
      url: PROBE_URL,
      headers: { origin: OTHER_ORIGIN, 'sec-fetch-site': 'cross-site' },
      ...withSession(token),
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'CROSS_SITE_REQUEST' });
  });

  it('answers 403 to a write from another origin when the browser sends no Sec-Fetch-Site', async () => {
    const response = await app.inject({ method: 'POST', url: '/auth/logout', headers: { origin: OTHER_ORIGIN } });

    expect(response.statusCode).toBe(403);
  });
});
