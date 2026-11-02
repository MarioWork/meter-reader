import type { UseFormRegisterReturn } from 'react-hook-form';

type Props = UseFormRegisterReturn & {
  id: string;
  latestDay: string;
  error?: string;
};

// The day the meter was read. `latestDay` keeps the picker off days that have not happened yet.
function ReadingDateField({ id, latestDay, error, ...registration }: Props) {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id}>Date</label>
      <input
        id={id}
        type="date"
        max={latestDay}
        aria-invalid={error !== undefined}
        aria-describedby={error ? errorId : undefined}
        className="self-start rounded-sm border border-gray-300 px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
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

export default ReadingDateField;
