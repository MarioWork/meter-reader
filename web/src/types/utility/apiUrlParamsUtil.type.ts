// A value set, not a TypeScript enum: erasableSyntaxOnly bans `enum`, and this reads the same at every call site.
export const ApiUrlParamsUtil = {
  sorting_fields: 'sorting_fields',
  sortingDirection: 'direction',
  page: 'page',
  pageSize: 'size',
  // The ends of a list's day range, both inclusive calendar days (YYYY-MM-DD).
  dateFrom: 'from',
  dateTo: 'to',
} as const;

export type ApiUrlParamsUtil = (typeof ApiUrlParamsUtil)[keyof typeof ApiUrlParamsUtil];
