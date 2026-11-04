import { renderRoutes, screen } from '@test-utils';
import BillField from './BillField';

const SAVED_BILL = {
  id: 1,
  name: 'water-bill-october-2026.pdf',
  contentType: 'application/pdf' as const,
  sizeBytes: 184_320,
};

// In a router: the saved bill's button opens it through the router's fetcher.
function renderBillField(error?: string) {
  const element = (
    <BillField
      savedBill={SAVED_BILL}
      isBillRemoved={false}
      chosenFileName={undefined}
      error={error}
      isDisabled={false}
      onFileChange={vi.fn()}
      onToggleRemoved={vi.fn()}
    />
  );

  renderRoutes([{ path: '/', element }]);

  return screen.findByLabelText('Bill');
}

it("marks the picker invalid and reads out the server's reason under it when the API refused a file that is no PDF", async () => {
  const field = await renderBillField('Bills must be a PDF.');

  expect(field).toHaveAttribute('aria-invalid', 'true');
  expect(field).toHaveAccessibleDescription(/Bills must be a PDF\./);
});

it('offers PDF files only in the picker', async () => {
  const field = await renderBillField();

  expect(field).toHaveAttribute('accept', 'application/pdf,.pdf');
});

it('describes the picker with its hint alone while nothing was refused', async () => {
  const field = await renderBillField();

  expect(field).toHaveAttribute('aria-invalid', 'false');
  expect(field).toHaveAccessibleDescription('A PDF of up to 10 MB. It replaces the saved bill.');
});
