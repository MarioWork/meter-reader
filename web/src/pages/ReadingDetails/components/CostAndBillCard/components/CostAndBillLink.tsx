import { PencilIcon, PlusIcon, type LucideIcon } from 'lucide-react';
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

// Type of link it is, by whether there is anything to edit yet.
// Whether there is anything to edit yet.
type CostAndBillLinkKind = 'add' | 'edit';

// What the link shows and is named, by kind.
type CostAndBillLinkLook = { label: string; Icon: LucideIcon };

const LINK_MAP: Record<CostAndBillLinkKind, CostAndBillLinkLook> = {
  add: { label: ADD_LABEL, Icon: PlusIcon },
  edit: { label: EDIT_LABEL, Icon: PencilIcon },
};

// Opens the cost & bill dialog over this page. A link, as the dialog has its own url. In the card's corner, an icon
// alone: a plus while there is nothing yet, a pencil after. Named "Add cost & bill" or "Edit cost & bill", which also
// shows as a tooltip on hover and on keyboard focus. 32 px square, over the 24 px minimum target.
function CostAndBillLink({ readingId, isEditing }: Props) {
  const costAndBillDialog = useToWithSearch(READING_ROUTES_PATHS.detailsCostAndBill(String(readingId)));
  const { label, Icon } = LINK_MAP[isEditing ? 'edit' : 'add'];

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            to={costAndBillDialog}
            aria-label={label}
            className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          />
        }
      >
        <Icon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export default CostAndBillLink;
