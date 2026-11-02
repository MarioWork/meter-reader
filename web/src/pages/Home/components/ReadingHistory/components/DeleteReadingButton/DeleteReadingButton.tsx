import type { ReadingApiModel } from '@app-types/models';
import Button from '@components/Button';
import ConfirmDialog from '@components/ConfirmDialog';
import { Alert, AlertTitle } from '@components/ui/alert';
import { formatIsoDate } from '@utils/dateUtils';
import { useDeleteReading } from './hooks/useDeleteReading';

type Props = {
  reading: ReadingApiModel;
};

const DIALOG_TITLE = 'Delete this reading?';
// The visible text of both buttons, and the start of the row button's fuller name (WCAG 2.5.3, label in name).
const DELETE_LABEL = 'Delete';
const DELETING_LABEL = 'Deleting…';

// A reading saved by mistake: Delete asks first.
function DeleteReadingButton({ reading }: Props) {
  const { isOpen, isDeleting, failureMessage, openDialog, closeDialog, deleteReading } = useDeleteReading(reading.id);
  const readingDate = formatIsoDate(reading.date);
  const hasPhoto = reading.photoId !== null;

  return (
    <>
      <Button variant="secondary" ariaLabel={`${DELETE_LABEL} the reading of ${readingDate}`} onClick={openDialog}>
        {DELETE_LABEL}
      </Button>
      <ConfirmDialog
        isOpen={isOpen}
        title={DIALOG_TITLE}
        confirmLabel={isDeleting ? DELETING_LABEL : DELETE_LABEL}
        isConfirming={isDeleting}
        onConfirm={deleteReading}
        onCancel={closeDialog}
      >
        <p>
          The reading <span className="font-mono tabular-nums">{reading.digits}</span> from {readingDate} will be
          removed from the history{hasPhoto && ', with its photo'}. This cannot be undone.
        </p>
        {failureMessage && (
          <Alert variant="destructive">
            <AlertTitle>{failureMessage}</AlertTitle>
          </Alert>
        )}
      </ConfirmDialog>
    </>
  );
}

export default DeleteReadingButton;
