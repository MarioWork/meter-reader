import { FieldError } from '@components/ui/field';
import MonthYearField from './MonthYearField';

type Props = {
  customFrom: string;
  customTo: string;
  isRangeBackwards: boolean;
  // Focused when the range is applied ending before it starts.
  customToRef: React.Ref<HTMLSelectElement>;
  onFromChange: (customFrom: string) => void;
  onToChange: (customTo: string) => void;
};

const TO_ERROR_ID = 'history-filter-to-error';
const BACKWARDS_RANGE_MESSAGE = 'Pick a To month on or after the From month';

// The custom range, in whole months: From starts on its month's first day, To ends on its last. Either end may stay
// empty, for a range open at that end.
function CustomRangeFields({ customFrom, customTo, isRangeBackwards, customToRef, onFromChange, onToChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <MonthYearField legend="From" value={customFrom} onChange={onFromChange} />
      <MonthYearField
        legend="To"
        value={customTo}
        isInvalid={isRangeBackwards}
        errorId={TO_ERROR_ID}
        monthRef={customToRef}
        onChange={onToChange}
      />
      {isRangeBackwards && (
        <FieldError id={TO_ERROR_ID} className="col-span-2">
          {BACKWARDS_RANGE_MESSAGE}
        </FieldError>
      )}
    </div>
  );
}

export default CustomRangeFields;
