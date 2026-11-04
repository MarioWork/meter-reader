import { useRef, useState } from 'react';
import { XIcon } from 'lucide-react';
import SmoothReveal from '@components/SmoothReveal';
import { Button } from '@components/ui/button';
import {
  hasHistoryFilters,
  historyFilterDraft,
  historyFiltersFromDraft,
  isRangeBackwards,
} from '@utils/historyFilterUtils';
import type { DatePreset, HistoryFilterValues } from '../types';
import { DatePreset as DatePresets } from '../types/datePreset.type';
import CustomRangeFields from './CustomRangeFields';
import DatePresetField from './DatePresetField';
import StatusField from './StatusField';

type Props = {
  filters: HistoryFilterValues;
  hasStatusFilter: boolean;
  onApply: (filters: HistoryFilterValues) => void;
  // A change made from the filters as they are when it lands, for the choices that keep the others.
  onUpdate: (makeFilters: (currentFilters: HistoryFilterValues) => HistoryFilterValues) => void;
};

type CustomMonths = { customFrom: string; customTo: string };

const BAR_LABEL = 'Filters';
const NO_FILTERS: HistoryFilterValues = { statuses: [] };
const APPLY_RANGE_LABEL = 'Apply';
const CLEAR_LABEL = 'Clear all';

// A wide screen's filters, always in view: the day ranges, the statuses and Clear all in one row, Custom's months
// under it. A day range or a status applies the moment it is pressed; Custom shows its months and applies them with
// Apply, so a half-picked range never runs. What is pressed comes from the applied filters, so the bar stays as it is
// (focus included) while the list reloads; only Custom being open and its months are its own.
function FilterBar({ filters, hasStatusFilter, onApply, onUpdate }: Props) {
  const applied = historyFilterDraft(filters);
  const isCustomApplied = applied.datePreset === DatePresets.CUSTOM;
  const [isCustomOpen, setIsCustomOpen] = useState(isCustomApplied);
  const [customMonths, setCustomMonths] = useState<CustomMonths>({
    customFrom: applied.customFrom,
    customTo: applied.customTo,
  });
  const customToRef = useRef<HTMLSelectElement>(null);
  const isFiltered = hasHistoryFilters(filters);
  const [wasFiltered, setWasFiltered] = useState(isFiltered);

  // Every filter cleared from elsewhere (No readings match's Clear filters) closes Custom too.
  if (wasFiltered !== isFiltered) {
    setWasFiltered(isFiltered);

    if (!isFiltered) setIsCustomOpen(false);
  }

  const shownPreset = isCustomOpen ? DatePresets.CUSTOM : applied.datePreset;
  const isCustomBackwards = isRangeBackwards({ dateFrom: customMonths.customFrom, dateTo: customMonths.customTo });

  const pickDatePreset = (datePreset: DatePreset | undefined) => {
    const isCustom = datePreset === DatePresets.CUSTOM;

    setIsCustomOpen(isCustom);

    if (isCustom) return;

    onUpdate((currentFilters) => historyFiltersFromDraft({ ...historyFilterDraft(currentFilters), datePreset }));
  };

  const applyCustomRange = () => {
    if (isCustomBackwards) {
      customToRef.current?.focus();

      return;
    }

    onUpdate((currentFilters) =>
      historyFiltersFromDraft({
        ...historyFilterDraft(currentFilters),
        ...customMonths,
        datePreset: DatePresets.CUSTOM,
      }),
    );
  };

  const clearAll = () => {
    setIsCustomOpen(false);
    onApply(NO_FILTERS);
  };

  return (
    <section aria-label={BAR_LABEL} className="flex flex-col">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <DatePresetField datePreset={shownPreset} isLegendHidden={!hasStatusFilter} onChange={pickDatePreset} />
        {hasStatusFilter && (
          <StatusField
            statuses={filters.statuses}
            onChange={(statuses) => onUpdate((currentFilters) => ({ ...currentFilters, statuses }))}
          />
        )}
        {isFiltered && (
          // At the end of the row, even when it wraps under the other filters on a narrower screen.
          <Button variant="ghost" onClick={clearAll} className="ml-auto">
            <XIcon aria-hidden="true" />
            {CLEAR_LABEL}
          </Button>
        )}
      </div>
      <SmoothReveal isOpen={isCustomOpen}>
        {/* The gap above it is inside, so a closed Custom leaves no space under the row. */}
        <div className="flex max-w-md flex-col gap-3 pt-3 pb-1">
          <CustomRangeFields
            customFrom={customMonths.customFrom}
            customTo={customMonths.customTo}
            isRangeBackwards={isCustomBackwards}
            customToRef={customToRef}
            onFromChange={(customFrom) => setCustomMonths((months) => ({ ...months, customFrom }))}
            onToChange={(customTo) => setCustomMonths((months) => ({ ...months, customTo }))}
          />
          <Button size="sm" onClick={applyCustomRange} className="self-start">
            {APPLY_RANGE_LABEL}
          </Button>
        </div>
      </SmoothReveal>
    </section>
  );
}

export default FilterBar;
