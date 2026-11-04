import { CheckIcon } from 'lucide-react';
import { ToggleGroupItem } from '@components/ui/toggle-group';
import { cn } from '@utils/classNameUtils';

type Props = {
  value: string;
  label: string;
};

// The same width pressed or not, so pressing one never nudges the others: unpressed, the tick's room (16 px and the
// 4 px gap) is split as padding on both sides, so the label stays centred; pressed, the padding gives it to the tick.
const STEADY_WIDTH_CLASS = 'px-5.5 aria-pressed:px-3';

// A wide screen's filter bar shows each choice as a pill, filled with the primary colour while pressed.
const WIDE_PILL_CLASS =
  'sm:rounded-full sm:aria-pressed:border-primary sm:aria-pressed:bg-primary sm:aria-pressed:text-primary-foreground sm:aria-pressed:hover:bg-primary/90 sm:aria-pressed:hover:text-primary-foreground';

// One choice in a filter's toggle group. A pressed choice shows a tick, so it shows by more than its colour; screen
// readers hear aria-pressed.
function ChoiceToggle({ value, label }: Props) {
  return (
    <ToggleGroupItem value={value} className={cn(STEADY_WIDTH_CLASS, WIDE_PILL_CLASS)}>
      {/* No data-icon: the hidden tick would still give the chip the narrower icon padding, so an unpressed label sat
          off-centre. */}
      <CheckIcon aria-hidden className="hidden group-aria-pressed/toggle:block" />
      {label}
    </ToggleGroupItem>
  );
}

export default ChoiceToggle;
