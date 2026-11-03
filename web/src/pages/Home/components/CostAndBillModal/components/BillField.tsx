import type { ChangeEvent } from 'react';
import type { ReadingBillApiModel } from '@app-types/models';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import SavedBill from './SavedBill';

type Props = {
  savedBill: ReadingBillApiModel | null;
  isBillRemoved: boolean;
  error: string | undefined;
  isDisabled: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggleRemoved: () => void;
};

const BILL_ID = 'cost-and-bill-bill';
const BILL_HINT_ID = 'cost-and-bill-bill-hint';
const BILL_ERROR_ID = 'cost-and-bill-bill-error';
const NEW_BILL_HINT = 'A PDF of up to 10 MB.';
const REPLACE_BILL_HINT = 'A PDF of up to 10 MB. It replaces the saved bill.';
// What the file picker offers: PDF files only. The API still checks the file itself.
const BILL_ACCEPT = 'application/pdf,.pdf';

// The provider's bill: the saved one, if any, with Remove bill, then a file picker to add one or replace it. The
// hint, and the API's reason once it refused a file, sit under the picker and describe it.
function BillField({ savedBill, isBillRemoved, error, isDisabled, onFileChange, onToggleRemoved }: Props) {
  const hasError = error !== undefined;
  const describedBy = hasError ? `${BILL_HINT_ID} ${BILL_ERROR_ID}` : BILL_HINT_ID;
  const hint = savedBill ? REPLACE_BILL_HINT : NEW_BILL_HINT;

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={BILL_ID}>Bill</FieldLabel>
      {savedBill && (
        <SavedBill
          bill={savedBill}
          isRemoved={isBillRemoved}
          isDisabled={isDisabled}
          onToggleRemoved={onToggleRemoved}
        />
      )}
      <Input
        id={BILL_ID}
        type="file"
        accept={BILL_ACCEPT}
        disabled={isDisabled}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        onChange={onFileChange}
      />
      <FieldDescription id={BILL_HINT_ID}>{hint}</FieldDescription>
      <FieldError id={BILL_ERROR_ID}>{error}</FieldError>
    </Field>
  );
}

export default BillField;
