import type { UseFormRegisterReturn } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { MESSAGE_PLACEHOLDERS } from '@utils/messageTemplateUtils';

type Props = {
  error?: string;
  registration: UseFormRegisterReturn;
};

const FIELD_ID = 'settings-client-number';
const HINT_ID = 'settings-client-number-hint';
const ERROR_ID = 'settings-client-number-error';
const LABEL = 'Client number';
const HINT = `Your number with the provider, if they ask for one. Put ${MESSAGE_PLACEHOLDERS.client} in the message where it goes.`;

// Optional: some providers file a reading by the client's number.
function ClientNumberField({ error, registration }: Props) {
  const hasError = error !== undefined;

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={FIELD_ID}>{LABEL}</FieldLabel>
      <Input
        id={FIELD_ID}
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

export default ClientNumberField;
