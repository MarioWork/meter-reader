import type { ReadingApiModel } from '@app-types/models';
import { Button } from '@components/ui/button';
import { formatIsoDate } from '@utils/dateUtils';
import DeleteReadingDialog from './components/DeleteReadingDialog';
import { useDeleteReading } from './hooks/useDeleteReading';

type Props = {
  reading: ReadingApiModel;
};

// The visible text of both buttons, and the start of the row button's fuller name (WCAG 2.5.3, label in name).
const DELETE_LABEL = 'Delete';

// A reading saved by mistake: Delete asks first.
function DeleteReadingButton({ reading }: Props) {
  const { isOpen, isDeleting, failureMessage, openDialog, handleOpenChange, deleteReading } = useDeleteReading(
    reading.id,
  );
  const readingDate = formatIsoDate(reading.date);

  return (
    <>
      <Button variant="outline" aria-label={`${DELETE_LABEL} the reading of ${readingDate}`} onClick={openDialog}>
        {DELETE_LABEL}
      </Button>
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

export default DeleteReadingButton;
