import type { UseFormRegisterReturn } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';

type Props = {
  error?: string;
  registration: UseFormRegisterReturn;
};

const FIELD_ID = 'settings-to';
const HINT_ID = 'settings-to-hint';
const ERROR_ID = 'settings-to-error';
const HINT = "The provider's address. Every reading is emailed here.";

function ToAddressField({ error, registration }: Props) {
  const hasError = error !== undefined;

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={FIELD_ID}>To</FieldLabel>
      <Input
        id={FIELD_ID}
        type="email"
        inputMode="email"
        autoComplete="off"
        aria-invalid={hasError}
        aria-describedby={hasError ? ERROR_ID : HINT_ID}
        {...registration}
      />
      {hasError ? (
        <FieldError id={ERROR_ID}>{error}</FieldError>
      ) : (
        <FieldDescription id={HINT_ID}>{HINT}</FieldDescription>
      )}
    </Field>
  );
}

export default ToAddressField;
