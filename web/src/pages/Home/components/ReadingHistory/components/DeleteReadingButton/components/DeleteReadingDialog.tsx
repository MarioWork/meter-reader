import type { ReadingApiModel } from '@app-types/models';
import { Alert, AlertTitle } from '@components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';
import { formatIsoDate } from '@utils/dateUtils';

type Props = {
  reading: ReadingApiModel;
  isOpen: boolean;
  isDeleting: boolean;
  failureMessage?: string;
  deleteLabel: string;
  onOpenChange: (isOpen: boolean) => void;
  onDelete: () => void;
};

const DIALOG_TITLE = 'Delete this reading?';
const DELETING_LABEL = 'Deleting…';

// Base UI keeps keyboard focus inside, Escape and Cancel close it, and focus goes back to the row's Delete button.
// Cancel comes first, so it takes the focus when the dialog opens: Enter alone never deletes.
function DeleteReadingDialog({
  reading,
  isOpen,
  isDeleting,
  failureMessage,
  deleteLabel,
  onOpenChange,
  onDelete,
}: Props) {
  const readingDate = formatIsoDate(reading.date);
  const hasPhoto = reading.photoId !== null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>{DIALOG_TITLE}</AlertDialogTitle>
        <AlertDialogDescription>
          The reading <span className="font-mono tabular-nums">{reading.digits}</span> from {readingDate} will be
          removed from the history{hasPhoto && ', with its photo'}. This cannot be undone.
        </AlertDialogDescription>
        {failureMessage && (
          <Alert variant="destructive">
            <AlertTitle>{failureMessage}</AlertTitle>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={onDelete}>
            {isDeleting ? DELETING_LABEL : deleteLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteReadingDialog;
