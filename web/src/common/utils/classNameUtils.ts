import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Joins class lists, conditional ones included, and lets a later utility win over an earlier one that sets the same
// property (a caller's `p-4` over a component's `p-2`), which clsx alone cannot do.
export function cn(...classLists: ClassValue[]) {
  return twMerge(clsx(classLists));
}
