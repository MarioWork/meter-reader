import type { LucideIcon } from 'lucide-react';

// One step-at-a-time crop button: its name, its picture, and what one click does.
export type CropButton = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
};
