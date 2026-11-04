import {
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@components/ui/dropdown-menu';
import { useTheme } from '@hooks/useTheme';
import { THEME_OPTIONS } from '@utils/themeOptionUtils';

// Light, dark or the device's setting, in the phone's menu and the sidebar's Theme menu alike. The menu stays open
// after a pick, so the check mark shows what took.
function ThemeMenuGroup() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>Theme</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
        {THEME_OPTIONS.map(({ value, label, Icon }) => (
          <DropdownMenuRadioItem key={value} value={value}>
            <Icon />
            {label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuGroup>
  );
}

export default ThemeMenuGroup;
