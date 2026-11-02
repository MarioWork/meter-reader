import type { ReadingStatusUtil } from '@app-types/utility';
import { FieldLegend, FieldSet } from '@components/ui/field';
import { ToggleGroup } from '@components/ui/toggle-group';
import { READING_STATUS_LABELS, READING_STATUSES } from '../../../readingStatusLabels';
import ChoiceToggle from './ChoiceToggle';

type Props = {
  statuses: ReadingStatusUtil[];
  onChange: (statuses: ReadingStatusUtil[]) => void;
};

const LEGEND = 'Status';

// Any number of statuses; none pressed shows every status.
function StatusField({ statuses, onChange }: Props) {
  const handleValueChange = (values: string[]) => {
    onChange(READING_STATUSES.filter((status) => values.includes(status)));
  };

  return (
    <FieldSet>
      <FieldLegend variant="label">{LEGEND}</FieldLegend>
      <ToggleGroup multiple variant="outline" value={statuses} onValueChange={handleValueChange} className="flex-wrap">
        {READING_STATUSES.map((status) => (
          <ChoiceToggle key={status} value={status} label={READING_STATUS_LABELS[status]} />
        ))}
      </ToggleGroup>
    </FieldSet>
  );
}

export default StatusField;
