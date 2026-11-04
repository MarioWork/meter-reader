import { CheckIcon, type LucideIcon } from 'lucide-react';
import { FieldDescription, FieldLegend, FieldSet } from '@components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@components/ui/toggle-group';

export type SegmentedOption<Value extends string> = {
  value: Value;
  label: string;
  Icon: LucideIcon;
};

type Props<Value extends string> = {
  // Names the group, seen and heard.
  legend: string;
  options: SegmentedOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  hint?: string;
};

// One choice out of a few, as a row of pressed / not pressed buttons. Pressing the one already pressed keeps it: there
// is always a choice. The pressed one shows a tick after its word, so it shows by more than its colour.
function SegmentedChoice<Value extends string>({ legend, options, value, onChange, hint }: Props<Value>) {
  const handleValueChange = (values: string[]) => {
    const pickedOption = options.find((option) => values.includes(option.value));

    if (pickedOption) onChange(pickedOption.value);
  };

  return (
    <FieldSet>
      <FieldLegend variant="label">{legend}</FieldLegend>
      <ToggleGroup variant="outline" value={[value]} onValueChange={handleValueChange} className="flex-wrap">
        {options.map(({ value: optionValue, label, Icon }) => (
          <ToggleGroupItem key={optionValue} value={optionValue}>
            <Icon data-icon="inline-start" aria-hidden="true" />
            {label}
            <CheckIcon data-icon="inline-end" aria-hidden="true" className="hidden group-aria-pressed/toggle:block" />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {hint && <FieldDescription>{hint}</FieldDescription>}
    </FieldSet>
  );
}

export default SegmentedChoice;
