import { MonitorIcon, MoonIcon, SunIcon, type LucideIcon } from 'lucide-react';
import { ThemeUtil } from '@app-types/utility';

type ThemeOption = {
  value: ThemeUtil;
  label: string;
  Icon: LucideIcon;
};

// The theme choices, in the phone's menu, the sidebar's Theme menu and Settings' Appearance card alike.
export const THEME_OPTIONS: ThemeOption[] = [
  { value: ThemeUtil.LIGHT, label: 'Light', Icon: SunIcon },
  { value: ThemeUtil.DARK, label: 'Dark', Icon: MoonIcon },
  { value: ThemeUtil.SYSTEM, label: 'System', Icon: MonitorIcon },
];
