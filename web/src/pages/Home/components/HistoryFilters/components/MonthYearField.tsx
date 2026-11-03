import { useState } from 'react';
import { FieldLegend, FieldSet } from '@components/ui/field';

type Props = {
  legend: string;
  // YYYY-MM, or empty while no month is picked.
  value: string;
  isInvalid?: boolean;
  errorId?: string;
  // Focused when the range is applied backwards (the To end only).
  monthRef?: React.Ref<HTMLSelectElement>;
  onChange: (value: string) => void;
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const MONTH_OFFSET = 1;
const MONTH_DIGITS = 2;
const YEARS_SHOWN = 10;
const MONTH_PLACEHOLDER = 'Month';
const YEAR_PLACEHOLDER = 'Year';
// The native select, styled like the app's inputs. Native, so every phone shows its own picker.
const SELECT_CLASSES =
  'h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30';

const MONTH_OPTIONS = MONTH_NAMES.map((name, index) => ({
  value: String(index + MONTH_OFFSET).padStart(MONTH_DIGITS, '0'),
  label: name,
}));

// This year and the nine before it, newest first.
function yearOptions(): string[] {
  const thisYear = new Date().getFullYear();

  return Array.from({ length: YEARS_SHOWN }, (_, index) => String(thisYear - index));
}

// One end of a custom range: a month and a year, each a native select. It only reports a value once both are picked;
// until then that end stays open.
function MonthYearField({ legend, value, isInvalid = false, errorId, monthRef, onChange }: Props) {
  const [initialYear = '', initialMonth = ''] = value ? value.split('-') : [];
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);

  const report = (nextMonth: string, nextYear: string) => {
    const isComplete = nextMonth !== '' && nextYear !== '';

    onChange(isComplete ? `${nextYear}-${nextMonth}` : '');
  };

  return (
    <FieldSet className="gap-2">
      <FieldLegend variant="label">{legend}</FieldLegend>
      <div className="grid grid-cols-2 gap-2">
        <select
          ref={monthRef}
          aria-label={`${legend} month`}
          value={month}
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? errorId : undefined}
          onChange={(event) => {
            setMonth(event.target.value);
            report(event.target.value, year);
          }}
          className={SELECT_CLASSES}
        >
          <option value="">{MONTH_PLACEHOLDER}</option>
          {MONTH_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label={`${legend} year`}
          value={year}
          aria-invalid={isInvalid}
          onChange={(event) => {
            setYear(event.target.value);
            report(month, event.target.value);
          }}
          className={SELECT_CLASSES}
        >
          <option value="">{YEAR_PLACEHOLDER}</option>
          {yearOptions().map((optionYear) => (
            <option key={optionYear} value={optionYear}>
              {optionYear}
            </option>
          ))}
        </select>
      </div>
    </FieldSet>
  );
}

export default MonthYearField;
