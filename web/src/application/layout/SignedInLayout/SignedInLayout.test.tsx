import { http, HttpResponse } from 'msw/http';
import routes from '@application/routes';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { MailStateUtil } from '@app-types/utility';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { renderRoutes, screen } from '@test-utils';

function answerMailStatus(state: MailStateUtil) {
  server.use(http.get(`${TEST_BASE_API_URL}/mail/status`, () => HttpResponse.json({ state })));
}

it('shows how to connect Hotmail when the server cannot send mail', async () => {
  answerMailStatus(MailStateUtil.NOT_CONNECTED);

  renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });

  await screen.findByRole('heading', { name: 'History' });
  expect(screen.getByRole('status')).toHaveTextContent(/Hotmail not connected.*yarn mail:connect/);
});

it('shows no Hotmail banner when Hotmail is connected', async () => {
  answerMailStatus(MailStateUtil.CONNECTED);

  renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });

  await screen.findByRole('heading', { name: 'History' });
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
