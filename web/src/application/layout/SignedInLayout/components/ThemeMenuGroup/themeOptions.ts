import { MonitorIcon, MoonIcon, SunIcon, type LucideIcon } from 'lucide-react';
import { ThemeUtil } from '@app-types/utility';

type ThemeOption = {
  value: ThemeUtil;
  label: string;
  Icon: LucideIcon;
};

// The theme choices, in the phone's menu and the sidebar's Theme menu alike.
export const THEME_OPTIONS: ThemeOption[] = [
  { value: ThemeUtil.LIGHT, label: 'Light', Icon: SunIcon },
  { value: ThemeUtil.DARK, label: 'Dark', Icon: MoonIcon },
  { value: ThemeUtil.SYSTEM, label: 'System', Icon: MonitorIcon },
];
