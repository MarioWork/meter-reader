import LoadingDigits from '@components/LoadingDigits';

const LOADING_LABEL = 'Loading…';

// The whole screen while the app starts: the loading meter, large, in the middle. Its word is for screen readers only.
function AppLoading() {
  return (
    <div role="status" className="grid min-h-dvh place-items-center bg-background text-primary">
      <LoadingDigits className="text-3xl" />
      <span className="sr-only">{LOADING_LABEL}</span>
    </div>
  );
}

export default AppLoading;
