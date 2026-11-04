import type { LucideIcon } from 'lucide-react';

// One choice out of a few, as a menu item or a pressed / not pressed button shows it: its value, its word and its icon.
export type ChoiceOptionUtil<Value extends string> = {
  value: Value;
  label: string;
  Icon: LucideIcon;
};
