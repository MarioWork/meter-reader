import { Button } from '@components/ui/button';
import { useTheme } from '@hooks/useTheme';
import { THEME_OPTIONS } from '../../../themeOptions';

const GROUP_LABEL = 'Theme';

// Light, dark or the device's setting, as three icon buttons. `aria-pressed` tells a screen reader which one is on;
// each is 32 px square, over the 24 px minimum target.
function ThemeToggleGroup() {
  const { theme, setTheme } = useTheme();

  return (
    <div role="group" aria-label={GROUP_LABEL} className="flex items-center gap-1 rounded-lg border p-0.5">
      {THEME_OPTIONS.map(({ value, label, Icon }) => {
        const isCurrent = theme === value;

        return (
          <Button
            key={value}
            variant={isCurrent ? 'secondary' : 'ghost'}
            size="icon"
            aria-label={label}
            aria-pressed={isCurrent}
            onClick={() => setTheme(value)}
          >
            <Icon aria-hidden="true" />
          </Button>
        );
      })}
    </div>
  );
}

export default ThemeToggleGroup;
