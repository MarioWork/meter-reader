import { useRef } from 'react';
import SmoothReveal from '@components/SmoothReveal';
import { FieldGroup } from '@components/ui/field';
import { historyFiltersFromDraft } from '@utils/historyFilterUtils';
import type { HistoryFilterValues } from '../types';
import { useFilterDraft } from '../hooks/useFilterDraft';
import CustomRangeFields from './CustomRangeFields';
import DatePresetField from './DatePresetField';
import StatusField from './StatusField';

type Props = {
  // The sheet's footer submits it from outside, by this id.
  id: string;
  filters: HistoryFilterValues;
  hasStatusFilter: boolean;
  onApply: (filters: HistoryFilterValues) => void;
};

// The sheet's choices: a day range, and the statuses unless the page has none. A custom range that ends before it starts is not applied; focus
// goes to the To day, which says why.
function FilterForm({ id, filters, hasStatusFilter, onApply }: Props) {
  const { draft, isCustomRange, isRangeBackwards, updateDraft } = useFilterDraft(filters);
  const customToRef = useRef<HTMLSelectElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isRangeBackwards) {
      customToRef.current?.focus();

      return;
    }

    onApply(historyFiltersFromDraft(draft));
  };

  return (
    <form id={id} noValidate onSubmit={handleSubmit}>
      <FieldGroup>
        <DatePresetField datePreset={draft.datePreset} onChange={(datePreset) => updateDraft({ datePreset })} />
        <SmoothReveal isOpen={isCustomRange}>
          <CustomRangeFields
            customFrom={draft.customFrom}
            customTo={draft.customTo}
            isRangeBackwards={isRangeBackwards}
            customToRef={customToRef}
            onFromChange={(customFrom) => updateDraft({ customFrom })}
            onToChange={(customTo) => updateDraft({ customTo })}
          />
        </SmoothReveal>
        {hasStatusFilter && (
          <StatusField statuses={draft.statuses} onChange={(statuses) => updateDraft({ statuses })} />
        )}
      </FieldGroup>
    </form>
  );
}

export default FilterForm;
