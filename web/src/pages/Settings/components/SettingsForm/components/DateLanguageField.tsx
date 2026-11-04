import type { UseFormRegisterReturn } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import { describedByIds } from '@utils/ariaUtils';
import { MESSAGE_PLACEHOLDERS } from '@utils/messageTemplateUtils';
import { MESSAGE_DATE_LANGUAGE_LABELS, MESSAGE_DATE_LANGUAGE_OPTIONS } from '@utils/messageDateFormatUtils';

type Props = {
  error?: string;
  registration: UseFormRegisterReturn;
};

const FIELD_ID = 'settings-date-language';
const HINT_ID = `${FIELD_ID}-hint`;
const ERROR_ID = `${FIELD_ID}-error`;
const LABEL = 'Date language';
const HINT = `The language the month is written in, in ${MESSAGE_PLACEHOLDERS.date}. Numbers-only formats read the same.`;

// English or Portuguese, each named in its own language.
function DateLanguageField({ error, registration }: Props) {
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
        {MESSAGE_DATE_LANGUAGE_OPTIONS.map((dateLanguage) => (
          <NativeSelectOption key={dateLanguage} value={dateLanguage}>
            {MESSAGE_DATE_LANGUAGE_LABELS[dateLanguage]}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <FieldDescription id={HINT_ID}>{HINT}</FieldDescription>
      <FieldError id={ERROR_ID}>{error}</FieldError>
    </Field>
  );
}

export default DateLanguageField;
