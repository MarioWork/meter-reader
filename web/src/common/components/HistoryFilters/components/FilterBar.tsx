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

// The filters laid out under the title on a wide screen, always in view. A day range or a status applies the moment
// it is pressed; Custom shows its months and applies them with Apply, so a half-picked range never runs. What is
// pressed comes from the applied filters, so the bar stays as it is (focus included) while the list reloads; only
// Custom being open and its months are its own.
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

  // Costs has no statuses: its bottom row is there only while Clear all is.
  const hasBottomRow = hasStatusFilter || isFiltered;
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
    <section aria-label={BAR_LABEL} className="flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <DatePresetField datePreset={shownPreset} onChange={pickDatePreset} />
      <SmoothReveal isOpen={isCustomOpen}>
        <div className="flex flex-col gap-3 pb-1">
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
      {hasBottomRow && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          {hasStatusFilter && (
            <StatusField
              statuses={filters.statuses}
              onChange={(statuses) => onUpdate((currentFilters) => ({ ...currentFilters, statuses }))}
            />
          )}
          {isFiltered && (
            // Right-aligned even when it is alone in the row (Costs) or wraps under the statuses.
            <Button variant="ghost" size="sm" onClick={clearAll} className="ml-auto">
              <XIcon aria-hidden="true" />
              {CLEAR_LABEL}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

export default FilterBar;
