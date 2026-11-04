import { useId } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@components/ui/toggle-group';
import { useTheme } from '@hooks/useTheme';
import { THEME_OPTIONS } from '@utils/themeOptionUtils';

const LABEL = 'Theme';
// The track: a soft strip holding the three side by side, each a third of it.
const TRACK_CLASS = 'grid w-full grid-cols-3 gap-1 rounded-xl bg-muted p-1';
// A segment: its icon over its word, 56 px tall (over the 24 px minimum target); the pressed one raised on a card.
const SEGMENT_CLASS =
  'h-14 w-full flex-col gap-1 rounded-lg text-xs text-muted-foreground hover:bg-transparent hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-foreground/10 [&_svg:not([class*=size-])]:size-5';

// Light, dark or the device's setting, as one segmented control, built on the app's toggle group: each is pressed or
// not for screen readers, and pressing the one already pressed keeps it, so there is always a theme. Changed at once,
// and the drawer stays open, so the change shows behind it.
function DrawerTheme() {
  const { theme, setTheme } = useTheme();
  const labelId = useId();

  const handleValueChange = (values: string[]) => {
    const picked = THEME_OPTIONS.find((option) => values.includes(option.value) && option.value !== theme);

    if (picked) setTheme(picked.value);
  };

  return (
    <div className="flex flex-col gap-2">
      <p id={labelId} className="px-1 text-sm font-medium text-muted-foreground">
        {LABEL}
      </p>
      <ToggleGroup aria-labelledby={labelId} value={[theme]} onValueChange={handleValueChange} className={TRACK_CLASS}>
        {THEME_OPTIONS.map(({ value, label, Icon }) => (
          <ToggleGroupItem key={value} value={value} className={SEGMENT_CLASS}>
            <Icon aria-hidden="true" />
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

export default DrawerTheme;
