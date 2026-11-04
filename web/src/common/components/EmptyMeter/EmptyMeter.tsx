import type { LucideIcon } from 'lucide-react';

type Props = {
  // The small sign at the bottom right that says why the meter is empty: a search that found nothing, say.
  BadgeIcon: LucideIcon;
};

// Where each of the four wheels starts across the window, on the drawing's 64 px wide grid.
const WHEEL_X = [8, 20, 32, 44];

// An empty state's picture, drawn like the app logo: the odometer window with its last wheel in aqua, but every wheel
// blank. It follows the theme's colours. Purely decorative: the heading beside it says what is going on.
function EmptyMeter({ BadgeIcon }: Props) {
  return (
    <div aria-hidden="true" className="relative">
      <svg viewBox="0 0 64 44" className="h-14 w-20">
        <rect x="2" y="2" width="60" height="40" rx="7" className="fill-card stroke-primary" strokeWidth="2.5" />
        <rect x="43" y="6" width="15" height="32" rx="3" className="fill-accent" />
        {WHEEL_X.map((wheelX) => (
          <line
            key={wheelX}
            x1={wheelX + 2}
            x2={wheelX + 10}
            y1="22"
            y2="22"
            strokeWidth="3"
            strokeLinecap="round"
            className="stroke-muted-foreground"
          />
        ))}
      </svg>
      <span className="absolute -right-2 -bottom-2 flex size-8 items-center justify-center rounded-full border-2 border-primary bg-background text-primary">
        <BadgeIcon className="size-4" />
      </span>
    </div>
  );
}

export default EmptyMeter;
