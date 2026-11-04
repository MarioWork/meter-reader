import { EuroIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react';
import { Link, type To } from 'react-router';
import { DropdownMenuGroup, DropdownMenuItem } from '@components/ui/dropdown-menu';

type Props = {
  // Where a sent reading's send preview is, to send it again; none while Send or Retry is the page's own button.
  resendTo?: To;
  costAndBillLabel: string;
  // Where the cost & bill dialog is: a routed modal over the page, so the item is a link.
  costAndBillTo: To;
  deleteLabel: string;
  onDelete: () => void;
};

const RESEND_LABEL = 'Resend';

// Resend for a sent reading, the cost & bill dialog, then Delete. (No View photo: the page shows the photo large.)
function ReadingPageMenuItems({ resendTo, costAndBillLabel, costAndBillTo, deleteLabel, onDelete }: Props) {
  return (
    <DropdownMenuGroup>
      {resendTo && (
        <DropdownMenuItem render={<Link to={resendTo} />}>
          <RefreshCwIcon />
          {RESEND_LABEL}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem render={<Link to={costAndBillTo} />}>
        <EuroIcon />
        {costAndBillLabel}
      </DropdownMenuItem>
      <DropdownMenuItem variant="destructive" onClick={onDelete}>
        <Trash2Icon />
        {deleteLabel}
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}

export default ReadingPageMenuItems;
