import { useState } from 'react';
import { useFetcher } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { ReadingApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import Button from '@components/Button';
import ConfirmDialog from '@components/ConfirmDialog';
import FormAlert from '@components/FormAlert';
import { useFetcherFailure } from '@hooks/useFetcherFailure';
import { formatIsoDate } from '@utils/dateUtils';

type Props = {
  reading: ReadingApiModel;
};

const DIALOG_TITLE = 'Delete this reading?';
const CONFIRM_LABEL = 'Delete';
const CONFIRMING_LABEL = 'Deleting…';
const FAILURE_MESSAGE = 'The reading could not be deleted. Please try again.';

// A reading saved by mistake: Delete asks first. Once deleted, Home's loader runs again and this row is gone.
function DeleteReadingButton({ reading }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const fetcher = useFetcher<JSONResponseUtil>();
  const failureMessage = useFetcherFailure(fetcher, FAILURE_MESSAGE);
  const isDeleting = fetcher.state !== 'idle';
  const readingDate = formatIsoDate(reading.date);

  // A failure from an earlier try is not shown again when the dialog reopens.
  const openDialog = () => {
    fetcher.reset();
    setIsOpen(true);
  };

  const closeDialog = () => setIsOpen(false);

  const deleteReading = () =>
    void fetcher.submit(null, {
      method: HttpVerbsUtil.DELETE,
      action: READING_ROUTES_PATHS.delete(String(reading.id)),
    });

  return (
    <>
      <Button variant="secondary" ariaLabel={`Delete the reading of ${readingDate}`} onClick={openDialog}>
        Delete
      </Button>
      <ConfirmDialog
        isOpen={isOpen}
        title={DIALOG_TITLE}
        confirmLabel={isDeleting ? CONFIRMING_LABEL : CONFIRM_LABEL}
        isConfirming={isDeleting}
        onConfirm={deleteReading}
        onCancel={closeDialog}
      >
        <p>
          The reading <span className="font-mono tabular-nums">{reading.digits}</span> from {readingDate} will be
          removed from the history. This cannot be undone.
        </p>
        {failureMessage && <FormAlert message={failureMessage} />}
      </ConfirmDialog>
    </>
  );
}

export default DeleteReadingButton;
