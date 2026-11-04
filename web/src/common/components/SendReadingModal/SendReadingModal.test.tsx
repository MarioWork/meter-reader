import routes from '@application/routes';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import { renderRoutes, screen, within } from '@test-utils';

// A reading the mock history saved without a photo (every fifth one). Adding one cannot run in jsdom (undici refuses
// jsdom's File when the router reads the form data): sendReadingModalActions.test.ts covers the upload.
const NO_PHOTO_READING_ID = 10;

async function openSendPreview(readingId: number) {
  renderRoutes(routes, { initialEntries: [READING_ROUTES_PATHS.detailsSend(String(readingId))] });

  return screen.findByRole('dialog', { name: 'Send this reading?' });
}

it('offers Add a photo when the reading has none, and no Attach photo switch', async () => {
  const dialog = await openSendPreview(NO_PHOTO_READING_ID);

  expect(within(dialog).getByText('No photo yet')).toBeVisible();
  expect(within(dialog).getByLabelText('Add a photo')).toHaveAttribute('accept', 'image/*');
  expect(within(dialog).queryByRole('switch', { name: 'Attach photo' })).not.toBeInTheDocument();
});
