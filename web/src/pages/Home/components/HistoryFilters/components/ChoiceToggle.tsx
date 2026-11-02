import { CheckIcon } from 'lucide-react';
import { ToggleGroupItem } from '@components/ui/toggle-group';

type Props = {
  value: string;
  label: string;
};

// One choice in a filter's toggle group. A pressed choice shows a tick, so it shows by more than its colour; screen
// readers hear aria-pressed.
function ChoiceToggle({ value, label }: Props) {
  return (
    <ToggleGroupItem value={value}>
      <CheckIcon data-icon="inline-start" aria-hidden className="hidden group-aria-pressed/toggle:block" />
      {label}
    </ToggleGroupItem>
  );
}

export default ChoiceToggle;
