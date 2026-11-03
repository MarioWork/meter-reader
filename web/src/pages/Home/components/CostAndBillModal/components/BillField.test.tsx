import { render, screen } from '@test-utils';
import BillField from './BillField';

const SAVED_BILL = {
  id: 1,
  name: 'water-bill-october-2026.pdf',
  contentType: 'application/pdf' as const,
  sizeBytes: 184_320,
};

function renderBillField(error?: string) {
  render(
    <BillField
      savedBill={SAVED_BILL}
      isBillRemoved={false}
      error={error}
      isDisabled={false}
      onFileChange={vi.fn()}
      onToggleRemoved={vi.fn()}
    />,
  );

  return screen.getByLabelText('Bill');
}

it("marks the picker invalid and reads out the server's reason under it when the API refused a file that is no PDF", () => {
  const field = renderBillField('Bills must be a PDF.');

  expect(field).toHaveAttribute('aria-invalid', 'true');
  expect(field).toHaveAccessibleDescription(/Bills must be a PDF\./);
});

it('offers PDF files only in the picker', () => {
  const field = renderBillField();

  expect(field).toHaveAttribute('accept', 'application/pdf,.pdf');
});

it('describes the picker with its hint alone while nothing was refused', () => {
  const field = renderBillField();

  expect(field).toHaveAttribute('aria-invalid', 'false');
  expect(field).toHaveAccessibleDescription('A PDF of up to 10 MB. It replaces the saved bill.');
});
