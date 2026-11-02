import { MonitorIcon, MoonIcon, SunIcon, type LucideIcon } from 'lucide-react';
import { ThemeUtil } from '@app-types/utility';
import {
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@components/ui/dropdown-menu';
import { useTheme } from '@hooks/useTheme';

type ThemeOption = {
  value: ThemeUtil;
  label: string;
  Icon: LucideIcon;
};

const THEME_OPTIONS: ThemeOption[] = [
  { value: ThemeUtil.LIGHT, label: 'Light', Icon: SunIcon },
  { value: ThemeUtil.DARK, label: 'Dark', Icon: MoonIcon },
  { value: ThemeUtil.SYSTEM, label: 'System', Icon: MonitorIcon },
];

// Light, dark or the device's setting. The menu stays open after a pick, so the check mark shows what took.
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
