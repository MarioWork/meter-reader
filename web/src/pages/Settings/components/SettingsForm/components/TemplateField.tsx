import type { UseFormRegisterReturn } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';

type Props = {
  id: string;
  label: string;
  hint: string;
  error?: string;
  isMultiline?: boolean;
  registration: UseFormRegisterReturn;
};

const BODY_ROWS = 3;

// One template, with its hint and, once refused, its error, both linked to it.
function TemplateField({ id, label, hint, error, isMultiline = false, registration }: Props) {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so the input would stop reaching the form state.
  'use no memo';

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const hasError = error !== undefined;
  const describedBy = hasError ? `${hintId} ${errorId}` : hintId;

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {isMultiline ? (
        <Textarea id={id} rows={BODY_ROWS} aria-invalid={hasError} aria-describedby={describedBy} {...registration} />
      ) : (
        <Input id={id} autoComplete="off" aria-invalid={hasError} aria-describedby={describedBy} {...registration} />
      )}
      <FieldDescription id={hintId}>{hint}</FieldDescription>
      <FieldError id={errorId}>{error}</FieldError>
    </Field>
  );
}

export default TemplateField;
