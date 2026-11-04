import { PencilIcon, PlusIcon } from 'lucide-react';
import { Link } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { ReadingId } from '@app-types/models';
import { buttonVariants } from '@components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';
import { useToWithSearch } from '@hooks/useToWithSearch';

type Props = {
  readingId: ReadingId;
  // Edit once the reading has a cost or a bill; Add until then.
  isEditing: boolean;
};

const ADD_LABEL = 'Add cost & bill';
const EDIT_LABEL = 'Edit cost & bill';

// Opens the cost & bill dialog over this page. A link, as the dialog has its own url. Add is a button with its words;
// Edit, in the card's corner, a pencil alone, named "Edit cost & bill" and showing that as a tooltip on hover and on
// keyboard focus. 32 px square, over the 24 px minimum target.
function CostAndBillLink({ readingId, isEditing }: Props) {
  const costAndBillDialog = useToWithSearch(READING_ROUTES_PATHS.detailsCostAndBill(String(readingId)));

  if (!isEditing) {
    return (
      <Link to={costAndBillDialog} className={buttonVariants({ variant: 'outline' })}>
        <PlusIcon aria-hidden="true" />
        {ADD_LABEL}
      </Link>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            to={costAndBillDialog}
            aria-label={EDIT_LABEL}
            className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          />
        }
      >
        <PencilIcon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{EDIT_LABEL}</TooltipContent>
    </Tooltip>
  );
}

export default CostAndBillLink;
