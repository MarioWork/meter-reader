import { http, HttpResponse } from 'msw/http';
import { ITEM_ROUTES_PATHS } from '@application/routes/routesUtils';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { renderRoutes, screen, userEvent, waitFor } from '@test-utils';
import ItemList from './ItemList';
import { createItemAction } from './itemListActions';
import { loader } from './itemListLoader';

const routes = [
  {
    path: ITEM_ROUTES_PATHS.BASE,
    Component: ItemList,
    loader,
    action: createItemAction,
    hydrateFallbackElement: <p>Loading…</p>,
  },
];

const renderItemList = () => renderRoutes(routes, { initialEntries: [ITEM_ROUTES_PATHS.BASE] });

it('lists the first page of items', async () => {
  renderItemList();

  expect(await screen.findByRole('heading', { name: 'Items' })).toBeVisible();
  expect(screen.getAllByRole('listitem')).toHaveLength(10);
});

it('keeps the name and shows the field error when the name is empty', async () => {
  renderItemList();
  await screen.findByRole('heading', { name: 'Items' });

  await userEvent.click(screen.getByRole('button', { name: 'Add item' }));

  const input = screen.getByRole('textbox', { name: 'Name' });
  expect(input).toHaveAccessibleDescription('Name is required');
  expect(input).toBeInvalid();
});

it('clears the form after the item is added', async () => {
  renderItemList();
  await screen.findByRole('heading', { name: 'Items' });

  await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Stapler');
  await userEvent.click(screen.getByRole('button', { name: 'Add item' }));

  await waitFor(() => expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(''));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('shows an alert and keeps the input when the API rejects the item', async () => {
  server.use(http.post(`${TEST_BASE_API_URL}/items`, () => HttpResponse.json({}, { status: 409 })));
  renderItemList();
  await screen.findByRole('heading', { name: 'Items' });

  await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Stapler');
  await userEvent.click(screen.getByRole('button', { name: 'Add item' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Stapler');
});
