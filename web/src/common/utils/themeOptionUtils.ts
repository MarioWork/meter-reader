import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { ThemeUtil, type ChoiceOptionUtil } from '@app-types/utility';

// The theme choices, in the phone's menu, the sidebar's Theme menu and Settings' Appearance card alike.
export const THEME_OPTIONS: ChoiceOptionUtil<ThemeUtil>[] = [
  { value: ThemeUtil.LIGHT, label: 'Light', Icon: SunIcon },
  { value: ThemeUtil.DARK, label: 'Dark', Icon: MoonIcon },
  { value: ThemeUtil.SYSTEM, label: 'System', Icon: MonitorIcon },
];
