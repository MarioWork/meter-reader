import { useState } from 'react';
import { useFetcher } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { ReadingId } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { useFetcherFailure } from '@hooks/useFetcherFailure';

const FAILURE_MESSAGE = 'The reading could not be deleted. Please try again.';

// The confirm dialog's open state and the delete's submit. Once deleted, Home's loader runs again and the row is gone.
export function useDeleteReading(readingId: ReadingId) {
  const [isOpen, setIsOpen] = useState(false);
  const fetcher = useFetcher<JSONResponseUtil>();
  const failureMessage = useFetcherFailure(fetcher, FAILURE_MESSAGE);
  const isDeleting = fetcher.state !== 'idle';

  // A failure from an earlier try is not shown again when the dialog reopens.
  const openDialog = () => {
    fetcher.reset();
    setIsOpen(true);
  };

  const closeDialog = () => setIsOpen(false);

  const deleteReading = () =>
    void fetcher.submit(null, {
      method: HttpVerbsUtil.DELETE,
      action: READING_ROUTES_PATHS.delete(String(readingId)),
    });

  return { isOpen, isDeleting, failureMessage, openDialog, closeDialog, deleteReading };
}
