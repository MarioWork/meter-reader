import type { UseFormRegisterReturn } from 'react-hook-form';

type Props = UseFormRegisterReturn & {
  id: string;
  label: string;
  autoComplete: 'current-password' | 'new-password';
  hint?: string;
  error?: string;
};

// A labelled password input. Its hint and its error belong to it (aria-describedby), and a wrong value marks it
// invalid. Paste and password managers work: nothing blocks them (WCAG 2.2 accessible authentication).
function PasswordField({ id, label, autoComplete, hint, error, ...registration }: Props) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : undefined, error ? errorId : undefined].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="password"
        autoComplete={autoComplete}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy || undefined}
        className={`rounded-sm border border-gray-300 px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700`}
        {...registration}
      />
      {hint && (
        <p id={hintId} className="text-sm text-gray-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export default PasswordField;
