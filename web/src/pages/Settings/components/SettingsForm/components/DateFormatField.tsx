import type { UseFormRegisterReturn } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import { describedByIds } from '@utils/ariaUtils';
import { MESSAGE_PLACEHOLDERS } from '@utils/messageTemplateUtils';
import { formatMessageDate, MESSAGE_DATE_FORMAT_OPTIONS } from '@utils/messageDateFormatUtils';

type Props = {
  error?: string;
  registration: UseFormRegisterReturn;
};

const FIELD_ID = 'settings-date-format';
const HINT_ID = `${FIELD_ID}-hint`;
const ERROR_ID = `${FIELD_ID}-error`;
const LABEL = 'Date format';
const HINT = `How ${MESSAGE_PLACEHOLDERS.date} is written in the email. Dates in the app stay as they are.`;
// The day every option is shown with: two-digit day and month, so each format reads apart from the others.
const SAMPLE_DATE = '2026-10-31';

// The four ways {date} can be written, each option a sample of itself.
function DateFormatField({ error, registration }: Props) {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so the input would stop reaching the form state.
  'use no memo';

  const hasError = error !== undefined;

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={FIELD_ID}>{LABEL}</FieldLabel>
      <NativeSelect
        id={FIELD_ID}
        aria-invalid={hasError}
        aria-describedby={describedByIds(HINT_ID, hasError ? ERROR_ID : undefined)}
        {...registration}
      >
        {MESSAGE_DATE_FORMAT_OPTIONS.map((dateFormat) => (
          <NativeSelectOption key={dateFormat} value={dateFormat}>
            {formatMessageDate(SAMPLE_DATE, dateFormat)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <FieldDescription id={HINT_ID}>{HINT}</FieldDescription>
      <FieldError id={ERROR_ID}>{error}</FieldError>
    </Field>
  );
}

export default DateFormatField;
