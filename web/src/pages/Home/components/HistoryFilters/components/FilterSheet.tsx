import { useId } from 'react';
import ResponsiveDialog from '../../ResponsiveDialog';
import { Button } from '@components/ui/button';
import type { HistoryFilterValues } from '../../../types';
import FilterForm from './FilterForm';

type Props = {
  isOpen: boolean;
  filters: HistoryFilterValues;
  onOpenChange: (isOpening: boolean) => void;
  onApply: (filters: HistoryFilterValues) => void;
};

const TITLE = 'Filter readings';
const CLOSE_LABEL = 'Close';
const APPLY_LABEL = 'Show readings';

// A bottom sheet on a phone, a dialog on a wider screen. Close leaves the filters as they were; Show readings applies
// the choices. The form inside is made again on every open, so it always starts from the url's filters.
function FilterSheet({ isOpen, filters, onOpenChange, onApply }: Props) {
  const formId = useId();

  const footer = (
    <>
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        {CLOSE_LABEL}
      </Button>
      <Button type="submit" form={formId}>
        {APPLY_LABEL}
      </Button>
    </>
  );

  return (
    <ResponsiveDialog title={TITLE} isOpen={isOpen} onOpenChange={onOpenChange} footer={footer}>
      <FilterForm id={formId} filters={filters} onApply={onApply} />
    </ResponsiveDialog>
  );
}

export default FilterSheet;
