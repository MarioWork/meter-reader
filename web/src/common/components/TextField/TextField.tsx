import type { UseFormRegisterReturn } from 'react-hook-form';

type Props = UseFormRegisterReturn & {
  id: string;
  label: string;
  type?: 'text' | 'password' | 'date';
  inputMode?: 'text' | 'numeric';
  autoComplete?: string;
  // The latest day a date input offers (YYYY-MM-DD).
  latestDate?: string;
  hint?: string;
  error?: string;
  // An element outside the field that also describes it (a warning shown under the form).
  describedById?: string;
};

// The app's one labelled input. Its hint, its error and any outside note belong to it (aria-describedby), and an
// error marks it invalid. Paste and password managers work: nothing blocks them.
function TextField({
  id,
  label,
  type = 'text',
  inputMode,
  autoComplete,
  latestDate,
  hint,
  error,
  describedById,
  ...registration
}: Props) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : undefined, error ? errorId : undefined, describedById].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        max={latestDate}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy || undefined}
        className="rounded-sm border border-input px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        {...registration}
      />
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export default TextField;
