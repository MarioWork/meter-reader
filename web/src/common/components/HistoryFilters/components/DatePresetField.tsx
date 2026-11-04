import { FieldLegend, FieldSet } from '@components/ui/field';
import { ToggleGroup } from '@components/ui/toggle-group';
import { cn } from '@utils/classNameUtils';
import { DATE_PRESET_LABELS, DATE_PRESETS } from '@utils/historyFilterUtils';
import type { DatePreset } from '../types';
import ChoiceToggle from './ChoiceToggle';

type Props = {
  datePreset?: DatePreset;
  // When the day range is the only filter, its chips say what they are: the legend is for screen readers only.
  isLegendHidden?: boolean;
  onChange: (datePreset: DatePreset | undefined) => void;
};

const LEGEND = 'Date';

// One day range at most. Pressing the picked one again unpicks it: any day.
function DatePresetField({ datePreset, isLegendHidden = false, onChange }: Props) {
  const pressedValues = datePreset ? [datePreset] : [];

  const handleValueChange = (values: string[]) => {
    onChange(DATE_PRESETS.find((preset) => values.includes(preset)));
  };

  return (
    <FieldSet>
      <FieldLegend variant="label" className={cn(isLegendHidden && 'sr-only')}>
        {LEGEND}
      </FieldLegend>
      <ToggleGroup variant="outline" value={pressedValues} onValueChange={handleValueChange} className="flex-wrap">
        {DATE_PRESETS.map((preset) => (
          <ChoiceToggle key={preset} value={preset} label={DATE_PRESET_LABELS[preset]} />
        ))}
      </ToggleGroup>
    </FieldSet>
  );
}

export default DatePresetField;
