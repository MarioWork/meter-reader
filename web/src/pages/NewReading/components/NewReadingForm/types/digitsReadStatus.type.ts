// Where reading the number from the photo has got to. A value set, not a TypeScript enum: erasableSyntaxOnly
// bans `enum`.
export const DigitsReadStatus = {
  IDLE: 'idle',
  READING: 'reading',
  NOTHING_FOUND: 'nothingFound',
  TIMED_OUT: 'timedOut',
} as const;

export type DigitsReadStatus = (typeof DigitsReadStatus)[keyof typeof DigitsReadStatus];
