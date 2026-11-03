import { EuroIcon, ImageIcon, Trash2Icon } from 'lucide-react';
import { Link, type To } from 'react-router';
import { DropdownMenuGroup, DropdownMenuItem } from '@components/ui/dropdown-menu';

type Props = {
  hasPhoto: boolean;
  costAndBillLabel: string;
  // Where the cost & bill dialog is: a routed modal, so the item is a link.
  costAndBillTo: To;
  deleteLabel: string;
  onViewPhoto: () => void;
  onDelete: () => void;
};

const VIEW_PHOTO_LABEL = 'View photo';

// View photo only when the reading has one; the cost & bill dialog and Delete always.
function ReadingMenuItems({ hasPhoto, costAndBillLabel, costAndBillTo, deleteLabel, onViewPhoto, onDelete }: Props) {
  return (
    <DropdownMenuGroup>
      {hasPhoto && (
        <DropdownMenuItem onClick={onViewPhoto}>
          <ImageIcon />
          {VIEW_PHOTO_LABEL}
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

export default ReadingMenuItems;
