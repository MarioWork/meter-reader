import ResponsiveDialog from '@components/ResponsiveDialog';
import { Button } from '@components/ui/button';

type Props = {
  isOpen: boolean;
  // The form inside, which the footer's Show readings submits by this id.
  formId: string;
  onOpenChange: (isOpening: boolean) => void;
  children: React.ReactNode;
};

const TITLE = 'Filter readings';
const APPLY_LABEL = 'Show readings';

// A bottom sheet on a phone, a dialog on a wider screen. The × in its corner leaves the filters as they were; Show readings applies
// the choices. The form inside is made again on every open, so it always starts from the url's filters.
function FilterSheet({ isOpen, formId, onOpenChange, children }: Props) {
  const footer = (
    <Button type="submit" form={formId}>
      {APPLY_LABEL}
    </Button>
  );

  return (
    <ResponsiveDialog title={TITLE} isOpen={isOpen} onOpenChange={onOpenChange} footer={footer}>
      {children}
    </ResponsiveDialog>
  );
}

export default FilterSheet;
