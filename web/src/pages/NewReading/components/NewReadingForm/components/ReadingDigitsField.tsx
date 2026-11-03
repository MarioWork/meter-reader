import type { UseFormRegisterReturn } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { describedByIds } from '@utils/ariaUtils';

type Props = {
  error?: string;
  // The lower-reading warning under the form, which also describes this field while it shows.
  warningId?: string;
  registration: UseFormRegisterReturn<'digits'>;
};

const DIGITS_FIELD_ID = 'reading-digits';
const DIGITS_ERROR_ID = 'reading-digits-error';
// Big, even-width digits, so the number reads like the meter's own window.
// Anything that is not a digit: a letter, a dot, a space, pasted or typed.
const NOT_A_DIGIT = /\D/g;
const DIGITS_CLASSES = 'h-16 text-center text-4xl font-semibold tracking-widest tabular-nums md:text-4xl';

// Text, not a number input: a number input drops leading zeros. inputMode still opens the digit keypad. Anything
// that is not a digit is dropped as it is typed or pasted, before the form sees it.
function ReadingDigitsField({ error, warningId, registration }: Props) {
  const hasError = error !== undefined;

  const keepDigitsOnly = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.target.value = event.target.value.replace(NOT_A_DIGIT, '');

    void registration.onChange(event);
  };

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={DIGITS_FIELD_ID}>Reading</FieldLabel>
      <Input
        id={DIGITS_FIELD_ID}
        inputMode="numeric"
        autoComplete="off"
        className={DIGITS_CLASSES}
        aria-invalid={hasError}
        aria-describedby={describedByIds(hasError ? DIGITS_ERROR_ID : undefined, warningId)}
        pattern="[0-9]*"
        {...registration}
        onChange={keepDigitsOnly}
      />
      <FieldError id={DIGITS_ERROR_ID}>{error}</FieldError>
    </Field>
  );
}

export default ReadingDigitsField;
