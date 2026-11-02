import { Field, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { todayAsIsoDate } from '@utils/dateUtils';

type Props = {
  customFrom: string;
  customTo: string;
  isRangeBackwards: boolean;
  // Focused when the sheet is applied with a range that ends before it starts.
  customToRef: React.Ref<HTMLInputElement>;
  onFromChange: (customFrom: string) => void;
  onToChange: (customTo: string) => void;
};

const FROM_FIELD_ID = 'history-filter-from';
const TO_FIELD_ID = 'history-filter-to';
const TO_ERROR_ID = 'history-filter-to-error';
const BACKWARDS_RANGE_MESSAGE = 'Pick a To day on or after the From day';

// The custom range: the phone's own date pickers. Either end may stay empty, for a range open at that end.
function CustomRangeFields({ customFrom, customTo, isRangeBackwards, customToRef, onFromChange, onToChange }: Props) {
  const today = todayAsIsoDate();

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field>
        <FieldLabel htmlFor={FROM_FIELD_ID}>From</FieldLabel>
        <Input
          id={FROM_FIELD_ID}
          type="date"
          max={today}
          value={customFrom}
          onChange={(event) => onFromChange(event.target.value)}
        />
      </Field>
      <Field data-invalid={isRangeBackwards}>
        <FieldLabel htmlFor={TO_FIELD_ID}>To</FieldLabel>
        <Input
          ref={customToRef}
          id={TO_FIELD_ID}
          type="date"
          max={today}
          value={customTo}
          aria-invalid={isRangeBackwards}
          aria-describedby={isRangeBackwards ? TO_ERROR_ID : undefined}
          onChange={(event) => onToChange(event.target.value)}
        />
      </Field>
      {isRangeBackwards && (
        <FieldError id={TO_ERROR_ID} className="col-span-2">
          {BACKWARDS_RANGE_MESSAGE}
        </FieldError>
      )}
    </div>
  );
}

export default CustomRangeFields;
