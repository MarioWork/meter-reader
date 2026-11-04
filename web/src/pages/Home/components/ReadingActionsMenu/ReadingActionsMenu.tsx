import { EllipsisIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { ReadingApiModel } from '@app-types/models';
import { Button } from '@components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@components/ui/dropdown-menu';
import { formatIsoDate } from '@utils/dateUtils';
import { getCostAndBillLabel } from '@utils/costAndBillUtils';
import { getPhotoUrl } from '@utils/readingPhotoUtils';
import DeleteReadingDialog from '@components/DeleteReadingDialog';
import PhotoDialog from './components/PhotoDialog';
import ReadingMenuItems from './components/ReadingMenuItems';
import { useDeleteReading } from '@hooks/useDeleteReading';

type Props = {
  reading: ReadingApiModel;
};

const MENU_LABEL = 'More actions for the reading of';
// The menu item's text, and the dialog's confirm button.
const DELETE_LABEL = 'Delete';
const PHOTO_DESCRIPTION = 'The meter showing';
const PHOTO_SUBTITLE = 'Reading';

// The "⋯" menu of a reading: View photo, the cost & bill dialog (a routed modal over the same page of the history),
// and Delete, which asks first. Each item opens its own dialog; closing it gives focus back to the "⋯" button.
function ReadingActionsMenu({ reading }: Props) {
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { search } = useLocation();
  const { isOpen, isDeleting, failureMessage, openDialog, handleOpenChange, deleteReading } = useDeleteReading(
    READING_ROUTES_PATHS.delete(String(reading.id)),
  );

  const readingDate = formatIsoDate(reading.date);
  const photoSubject = `${reading.digits} on ${readingDate}`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          ref={menuButtonRef}
          render={<Button variant="ghost" size="icon-lg" aria-label={`${MENU_LABEL} ${readingDate}`} />}
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto">
          <ReadingMenuItems
            hasPhoto={reading.photoId !== null}
            costAndBillLabel={getCostAndBillLabel(reading)}
            costAndBillTo={{ pathname: READING_ROUTES_PATHS.costAndBill(String(reading.id)), search }}
            deleteLabel={DELETE_LABEL}
            onViewPhoto={() => setIsPhotoOpen(true)}
            onDelete={openDialog}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      {reading.photoId !== null && (
        <PhotoDialog
          isOpen={isPhotoOpen}
          title={`Photo of the ${readingDate} reading`}
          subtitle={`${PHOTO_SUBTITLE} ${reading.digits}`}
          photoUrl={getPhotoUrl(reading.photoId)}
          photoDescription={`${PHOTO_DESCRIPTION} ${photoSubject}`}
          returnFocusRef={menuButtonRef}
          onClose={() => setIsPhotoOpen(false)}
        />
      )}
      <DeleteReadingDialog
        reading={reading}
        isOpen={isOpen}
        isDeleting={isDeleting}
        failureMessage={failureMessage}
        deleteLabel={DELETE_LABEL}
        onOpenChange={handleOpenChange}
        onDelete={deleteReading}
      />
    </>
  );
}

export default ReadingActionsMenu;
