import type { UseFormRegisterReturn } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { describedByIds } from '@utils/ariaUtils';

type Props = {
  id: string;
  label: string;
  // Required, so password managers fill and save it (WCAG 2.2 accessible authentication).
  autoComplete: 'current-password' | 'new-password';
  hint?: string;
  error?: string;
  registration: UseFormRegisterReturn;
};

// A labelled password input. Its hint and its error belong to it (aria-describedby), and an error marks it invalid.
// Nothing blocks paste.
function PasswordInputField({ id, label, autoComplete, hint, error, registration }: Props) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const hasError = error !== undefined;

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="password"
        autoComplete={autoComplete}
        aria-invalid={hasError}
        aria-describedby={describedByIds(hintId, errorId)}
        {...registration}
      />
      {hint && <FieldDescription id={hintId}>{hint}</FieldDescription>}
      <FieldError id={errorId}>{error}</FieldError>
    </Field>
  );
}

export default PasswordInputField;
