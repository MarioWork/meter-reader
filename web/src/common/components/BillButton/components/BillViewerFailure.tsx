import { FileWarningIcon, RotateCwIcon } from 'lucide-react';
import { Button } from '@components/ui/button';

type Props = {
  onRetry: () => void;
};

const FAILED_TEXT = "The bill couldn't be opened. Check your connection and try again.";
const RETRY_LABEL = 'Try again';
const VIEWER_SELECTOR = 'dialog';

// The bill could not be fetched or read: said at once, with one way to try again.
function BillViewerFailure({ onRetry }: Props) {
  // The spinner replaces this button: focus moves to the viewer itself instead of falling to the page behind it.
  const handleRetry = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.closest<HTMLElement>(VIEWER_SELECTOR)?.focus();
    onRetry();
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <p role="alert" className="flex max-w-sm items-center gap-2 text-sm">
        <FileWarningIcon aria-hidden="true" className="size-5 shrink-0 text-destructive" />
        {FAILED_TEXT}
      </p>
      <Button type="button" variant="outline" size="lg" onClick={handleRetry}>
        <RotateCwIcon data-icon="inline-start" aria-hidden="true" />
        {RETRY_LABEL}
      </Button>
    </div>
  );
}

export default BillViewerFailure;
