import { useState } from 'react';
import { historyFilterDraft, isRangeBackwards } from '@utils/historyFilterUtils';
import type { HistoryFilterDraft, HistoryFilterValues } from '../types';
import { DatePreset } from '../types/datePreset.type';

// The filter sheet's choices, starting from the url's filters each time the sheet opens. Nothing reaches the url
// until they are applied.
export function useFilterDraft(filters: HistoryFilterValues) {
  const [draft, setDraft] = useState(() => historyFilterDraft(filters));

  const isCustomRange = draft.datePreset === DatePreset.CUSTOM;
  const customRange = { dateFrom: draft.customFrom, dateTo: draft.customTo };
  const isCustomRangeBackwards = isCustomRange && isRangeBackwards(customRange);

  const updateDraft = (changes: Partial<HistoryFilterDraft>) => {
    setDraft((currentDraft) => ({ ...currentDraft, ...changes }));
  };

  return { draft, isCustomRange, isRangeBackwards: isCustomRangeBackwards, updateDraft };
}
