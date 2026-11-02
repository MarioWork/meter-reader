import type { UseFormRegisterReturn } from 'react-hook-form';

type Props = UseFormRegisterReturn & {
  id: string;
  error?: string;
  warningId?: string;
};

const DIGITS_PATTERN = '[0-9]*';

// Text, not a number input: a number input drops leading zeros. `inputMode` still opens the digit keypad on a phone.
// Its error and its warning both belong to it (aria-describedby); only the error marks it invalid.
function ReadingDigitsField({ id, error, warningId, ...registration }: Props) {
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : undefined, warningId].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id}>Reading</label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern={DIGITS_PATTERN}
        autoComplete="off"
        aria-invalid={error !== undefined}
        aria-describedby={describedBy || undefined}
        className="rounded-sm border border-gray-300 px-2 py-1 font-mono text-lg tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        {...registration}
      />
      {error && (
        <p id={errorId} className="text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export default ReadingDigitsField;
