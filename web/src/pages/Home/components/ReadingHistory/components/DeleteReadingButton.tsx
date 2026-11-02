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

const FAILURE_MESSAGE = 'The reading could not be deleted. Please try again.';

// A reading saved by mistake: Delete asks first. Once deleted, Home's loader runs again and this row is gone.
function DeleteReadingButton({ reading }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const fetcher = useFetcher<JSONResponseUtil>();
  const failureMessage = useFetcherFailure(fetcher, FAILURE_MESSAGE);
  const isDeleting = fetcher.state !== 'idle';
  const readingDate = formatIsoDate(reading.date);

  const openDialog = () => setIsOpen(true);
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
        title="Delete this reading?"
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete'}
        isConfirming={isDeleting}
        onConfirm={deleteReading}
        onCancel={closeDialog}
      >
        <p>
          The reading <span className="font-mono tabular-nums">{reading.digits}</span> from {readingDate} will be
          removed from the history, with its photo. This cannot be undone.
        </p>
        {failureMessage && <FormAlert message={failureMessage} />}
      </ConfirmDialog>
    </>
  );
}

export default DeleteReadingButton;
