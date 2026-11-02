import type { UseFormRegisterReturn } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { todayAsIsoDate } from '@utils/dateUtils';

type Props = {
  error?: string;
  registration: UseFormRegisterReturn<'date'>;
};

const DATE_FIELD_ID = 'reading-date';
const DATE_ERROR_ID = 'reading-date-error';

// The day the meter was read. The date picker offers today at the latest.
function ReadingDateField({ error, registration }: Props) {
  const hasError = error !== undefined;

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={DATE_FIELD_ID}>Date</FieldLabel>
      <Input
        id={DATE_FIELD_ID}
        type="date"
        max={todayAsIsoDate()}
        aria-invalid={hasError}
        aria-describedby={hasError ? DATE_ERROR_ID : undefined}
        {...registration}
      />
      <FieldError id={DATE_ERROR_ID}>{error}</FieldError>
    </Field>
  );
}

export default ReadingDateField;
