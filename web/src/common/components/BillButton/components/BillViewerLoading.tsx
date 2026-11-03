import { Spinner } from '@components/ui/spinner';

const LOADING_TEXT = 'Opening the bill…';

// While the bill is fetched and read: a spinner and a line saying so, read out once.
function BillViewerLoading() {
  return (
    <p role="status" className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Spinner aria-hidden="true" />
      {LOADING_TEXT}
    </p>
  );
}

export default BillViewerLoading;
