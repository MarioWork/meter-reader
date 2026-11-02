import { ImageIcon, Trash2Icon } from 'lucide-react';
import { DropdownMenuGroup, DropdownMenuItem } from '@components/ui/dropdown-menu';

type Props = {
  hasPhoto: boolean;
  deleteLabel: string;
  onViewPhoto: () => void;
  onDelete: () => void;
};

const VIEW_PHOTO_LABEL = 'View photo';

// View photo only when the reading has one; Delete always.
function ReadingMenuItems({ hasPhoto, deleteLabel, onViewPhoto, onDelete }: Props) {
  return (
    <DropdownMenuGroup>
      {hasPhoto && (
        <DropdownMenuItem onClick={onViewPhoto}>
          <ImageIcon />
          {VIEW_PHOTO_LABEL}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem variant="destructive" onClick={onDelete}>
        <Trash2Icon />
        {deleteLabel}
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}

export default ReadingMenuItems;
