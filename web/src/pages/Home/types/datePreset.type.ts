// The day ranges the filter sheet offers. Each one ends today; Custom is whatever days the user picks. A value set,
// not a TypeScript enum: erasableSyntaxOnly bans `enum`.
export const DatePreset = {
  THIS_MONTH: 'thisMonth',
  LAST_THREE_MONTHS: 'lastThreeMonths',
  THIS_YEAR: 'thisYear',
  CUSTOM: 'custom',
} as const;

export type DatePreset = (typeof DatePreset)[keyof typeof DatePreset];

// A preset whose days follow from today.
export type NamedDatePreset = Exclude<DatePreset, typeof DatePreset.CUSTOM>;
