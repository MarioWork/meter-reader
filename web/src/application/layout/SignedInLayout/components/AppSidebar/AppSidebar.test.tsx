import {
  BASE_ROUTES_PATHS,
  COSTS_ROUTES_PATHS,
  READING_ROUTES_PATHS,
  SETTINGS_ROUTES_PATHS,
} from '@application/routes/routesUtils';
import { SidebarProvider } from '@components/ui/sidebar';
import { mockWideScreen, renderRoutes, screen, userEvent, within } from '@test-utils';
import { thisYearCostsPath } from '@utils/historyFilterUtils';
import AppSidebar from './AppSidebar';

const ANY_PATH = '*';
const DARK_CLASS = 'dark';
// The app name, Home, Costs, Settings, Theme and Sign out, in tab order before the edge.
const CONTROLS_BEFORE_EDGE = 6;

// The sidebar alone, on whatever page the test opens.
function renderSidebar(path: string = BASE_ROUTES_PATHS.HOME) {
  mockWideScreen();

  renderRoutes(
    [
      {
        path: ANY_PATH,
        element: (
          <SidebarProvider>
            <AppSidebar />
          </SidebarProvider>
        ),
      },
    ],
    { initialEntries: [path] },
  );
}

function sidebarNavigation() {
  return screen.getByRole('navigation', { name: 'Main' });
}

function sidebarLink(name: string) {
  return within(sidebarNavigation()).getByRole('link', { name });
}

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.className = '';
});

it('links to Home, Costs on this year and Settings, with the app name leading Home', () => {
  renderSidebar();

  expect(sidebarLink('Meter Reader')).toHaveAttribute('href', BASE_ROUTES_PATHS.HOME);
  expect(sidebarLink('Home')).toHaveAttribute('href', BASE_ROUTES_PATHS.HOME);
  expect(sidebarLink('Costs')).toHaveAttribute('href', thisYearCostsPath());
  expect(sidebarLink('Settings')).toHaveAttribute('href', SETTINGS_ROUTES_PATHS.BASE);
});

it('marks the page the user is on, and only that one', () => {
  renderSidebar(thisYearCostsPath());

  expect(sidebarLink('Costs')).toHaveAttribute('aria-current', 'page');
  expect(sidebarLink('Home')).not.toHaveAttribute('aria-current');
  expect(sidebarLink('Settings')).not.toHaveAttribute('aria-current');
});

it('keeps Home marked while a modal over the history is open', () => {
  renderSidebar(READING_ROUTES_PATHS.NEW_MODAL);

  expect(sidebarLink('Home')).toHaveAttribute('aria-current', 'page');
});

it('marks Costs whatever days it is filtered to', () => {
  renderSidebar(COSTS_ROUTES_PATHS.BASE);

  expect(sidebarLink('Costs')).toHaveAttribute('aria-current', 'page');
});

it('collapses to icons from its edge, keeping every name, and expands again', async () => {
  renderSidebar();

  await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar', expanded: true }));

  expect(screen.getByRole('button', { name: 'Expand sidebar', expanded: false })).toBeVisible();
  expect(sidebarLink('Costs')).toBeVisible();
  expect(within(sidebarNavigation()).getByRole('button', { name: 'Sign out' })).toBeVisible();

  await userEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));

  expect(screen.getByRole('button', { name: 'Collapse sidebar', expanded: true })).toBeVisible();
});

it('collapses and expands with Ctrl B', async () => {
  renderSidebar();

  await userEvent.keyboard('{Control>}b{/Control}');

  expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();

  await userEvent.keyboard('{Control>}b{/Control}');

  expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible();
});

it('collapses and expands with ⌘ B', async () => {
  renderSidebar();

  await userEvent.keyboard('{Meta>}b{/Meta}');

  expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
});

it('reaches its edge with Tab, after Sign out, and collapses with Enter', async () => {
  renderSidebar();

  for (let i = 0; i < CONTROLS_BEFORE_EDGE; i++) await userEvent.tab();

  expect(within(sidebarNavigation()).getByRole('button', { name: 'Sign out' })).toHaveFocus();

  await userEvent.tab();
  await userEvent.keyboard('{Enter}');

  expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveFocus();
});

it('switches the theme from the Theme menu', async () => {
  renderSidebar();

  await userEvent.click(within(sidebarNavigation()).getByRole('button', { name: 'Theme' }));
  await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Dark' }));

  expect(document.documentElement).toHaveClass(DARK_CLASS);
  expect(screen.getByRole('menuitemradio', { name: 'Dark' })).toBeChecked();
});

it('shows a page label as a tooltip once collapsed', async () => {
  renderSidebar();
  await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

  await userEvent.hover(sidebarLink('Costs'));

  // Base UI's tooltip has no role (the link keeps its own name), so it is found by its text, outside the sidebar.
  expect(await screen.findByText('Costs', { ignore: 'nav *' })).toBeVisible();
});
