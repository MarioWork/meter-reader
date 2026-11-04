import type { ChangeEvent } from 'react';
import type { ReadingBillApiModel } from '@app-types/models';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import BillFilePicker from './BillFilePicker';
import SavedBill from './SavedBill';

type Props = {
  savedBill: ReadingBillApiModel | null;
  isBillRemoved: boolean;
  // The new file picked, by name; undefined until one is.
  chosenFileName: string | undefined;
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

// The provider's bill: the saved one, if any, with its remove button at the end of its row, then a file picker to add
// one or replace it. The
// hint, and the API's reason once it refused a file, sit under the picker and describe it.
function BillField({
  savedBill,
  isBillRemoved,
  chosenFileName,
  error,
  isDisabled,
  onFileChange,
  onToggleRemoved,
}: Props) {
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
      <BillFilePicker
        id={BILL_ID}
        accept={BILL_ACCEPT}
        chosenFileName={chosenFileName}
        hasError={hasError}
        describedBy={describedBy}
        isDisabled={isDisabled}
        onFileChange={onFileChange}
      />
      <FieldDescription id={BILL_HINT_ID}>{hint}</FieldDescription>
      <FieldError id={BILL_ERROR_ID}>{error}</FieldError>
    </Field>
  );
}

export default BillField;
