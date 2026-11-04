import LoadingDigits from '@components/LoadingDigits';

const LOADING_TEXT = 'Opening the bill…';

// While the bill is fetched and read: the loading meter and a line saying so, read out once.
function BillViewerLoading() {
  return (
    <p role="status" className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
      <LoadingDigits />
      {LOADING_TEXT}
    </p>
  );
}

export default BillViewerLoading;
