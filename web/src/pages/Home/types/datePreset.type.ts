// The day ranges the filters offer. Each one ends today, except Last year, which is all of last calendar year;
// Custom is whatever days the user picks. A value set,
// not a TypeScript enum: erasableSyntaxOnly bans `enum`.
export const DatePreset = {
  THIS_MONTH: 'thisMonth',
  THIS_YEAR: 'thisYear',
  LAST_YEAR: 'lastYear',
  CUSTOM: 'custom',
} as const;

export type DatePreset = (typeof DatePreset)[keyof typeof DatePreset];

// A preset whose days follow from today.
export type NamedDatePreset = Exclude<DatePreset, typeof DatePreset.CUSTOM>;
