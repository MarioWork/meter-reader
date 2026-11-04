import { CheckIcon } from 'lucide-react';
import { ToggleGroupItem } from '@components/ui/toggle-group';

type Props = {
  value: string;
  label: string;
};

// A wide screen's filter bar shows each choice as a pill, filled with the primary colour while pressed.
const WIDE_PILL_CLASS =
  'sm:rounded-full sm:px-3 sm:aria-pressed:border-primary sm:aria-pressed:bg-primary sm:aria-pressed:text-primary-foreground sm:aria-pressed:hover:bg-primary/90 sm:aria-pressed:hover:text-primary-foreground';

// One choice in a filter's toggle group. A pressed choice shows a tick, so it shows by more than its colour; screen
// readers hear aria-pressed.
function ChoiceToggle({ value, label }: Props) {
  return (
    <ToggleGroupItem value={value} className={WIDE_PILL_CLASS}>
      <CheckIcon data-icon="inline-start" aria-hidden className="hidden group-aria-pressed/toggle:block" />
      {label}
    </ToggleGroupItem>
  );
}

export default ChoiceToggle;
