import { EuroIcon, Trash2Icon } from 'lucide-react';
import { Link, type To } from 'react-router';
import { DropdownMenuGroup, DropdownMenuItem } from '@components/ui/dropdown-menu';

type Props = {
  costAndBillLabel: string;
  // Where the cost & bill dialog is: a routed modal over the page, so the item is a link.
  costAndBillTo: To;
  deleteLabel: string;
  onDelete: () => void;
};

// The cost & bill dialog, then Delete. (No View photo: the page shows the photo large.)
function ReadingPageMenuItems({ costAndBillLabel, costAndBillTo, deleteLabel, onDelete }: Props) {
  return (
    <DropdownMenuGroup>
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
