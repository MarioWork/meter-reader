import { http, HttpResponse } from 'msw/http';
import routes from '@application/routes';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { MailStateUtil, ThemeUtil } from '@app-types/utility';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { mockWideScreen, renderRoutes, screen, userEvent, within } from '@test-utils';
import { thisYearCostsPath } from '@utils/historyFilterUtils';
import { THEME_STORAGE_KEY } from '@utils/themeUtils';

const DARK_CLASS = 'dark';

function answerMailStatus(state: MailStateUtil) {
  server.use(http.get(`${TEST_BASE_API_URL}/mail/status`, () => HttpResponse.json({ state })));
}

async function renderHomeAndOpenMenu() {
  renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });
  await screen.findByRole('heading', { name: 'Water Readings' });

  await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
  await screen.findByRole('menu');
}

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.className = '';
});

it('shows how to connect Hotmail when the server cannot send mail', async () => {
  answerMailStatus(MailStateUtil.NOT_CONNECTED);

  renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });

  await screen.findByRole('heading', { name: 'Water Readings' });
  expect(screen.getByRole('status')).toHaveTextContent(/Hotmail not connected.*yarn mail:connect/);
});

it('shows no Hotmail banner when Hotmail is connected', async () => {
  answerMailStatus(MailStateUtil.CONNECTED);

  renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });

  await screen.findByRole('heading', { name: 'Water Readings' });
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('offers the three themes in the header menu, with the current one checked', async () => {
  await renderHomeAndOpenMenu();

  expect(screen.getByRole('menuitemradio', { name: 'Light' })).not.toBeChecked();
  expect(screen.getByRole('menuitemradio', { name: 'Dark' })).not.toBeChecked();
  expect(screen.getByRole('menuitemradio', { name: 'System' })).toBeChecked();
});

it('switches to the theme picked in the header menu, and remembers it', async () => {
  await renderHomeAndOpenMenu();

  await userEvent.click(screen.getByRole('menuitemradio', { name: 'Dark' }));

  expect(document.documentElement).toHaveClass(DARK_CLASS);
  expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(ThemeUtil.DARK);
});

it('opens Costs from the header menu', async () => {
  await renderHomeAndOpenMenu();

  await userEvent.click(screen.getByRole('menuitem', { name: 'Costs' }));

  expect(await screen.findByRole('heading', { level: 1, name: 'Water Readings Costs' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Remove filter: This year' })).toBeVisible();
});

it('opens Settings from the header menu', async () => {
  await renderHomeAndOpenMenu();

  await userEvent.click(screen.getByRole('menuitem', { name: 'Settings' }));

  expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
});

async function renderHomeOnWideScreen() {
  mockWideScreen();
  const { router } = renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });
  await screen.findByRole('heading', { name: 'Water Readings' });

  return router;
}

function sidebarNavigation() {
  return screen.getByRole('navigation', { name: 'Main' });
}

it('shows the sidebar instead of the header on a wide screen', async () => {
  await renderHomeOnWideScreen();

  expect(within(sidebarNavigation()).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
});

it('opens Costs on this year from the sidebar', async () => {
  const router = await renderHomeOnWideScreen();

  await userEvent.click(within(sidebarNavigation()).getByRole('link', { name: 'Costs' }));

  expect(await screen.findByRole('heading', { level: 1, name: 'Water Readings Costs' })).toBeVisible();

  const { pathname, search } = router.state.location;

  expect(`${pathname}${search}`).toBe(thisYearCostsPath());
  expect(within(sidebarNavigation()).getByRole('link', { name: 'Costs' })).toHaveAttribute('aria-current', 'page');
});

it('opens Settings from the sidebar', async () => {
  await renderHomeOnWideScreen();

  await userEvent.click(within(sidebarNavigation()).getByRole('link', { name: 'Settings' }));

  expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
});

it('signs out from the sidebar and opens the login page', async () => {
  await renderHomeOnWideScreen();

  await userEvent.click(within(sidebarNavigation()).getByRole('button', { name: 'Sign out' }));

  expect(await screen.findByRole('heading', { name: 'Welcome back!' })).toBeVisible();
});

it('signs out from the header menu and opens the login page', async () => {
  await renderHomeAndOpenMenu();

  await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));

  expect(await screen.findByRole('heading', { name: 'Welcome back!' })).toBeVisible();
});
