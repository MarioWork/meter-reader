import Logo from '@components/Logo';

const APP_NAME = 'Meter Reader';

// The logo and the app name, on every page: in the signed-in header and over the standalone pages' card. Not a
// heading, so each page keeps its own title as its only h1. The logo is decorative next to the name.
function AppBrand() {
  return (
    <p className="flex items-center gap-2 text-lg font-semibold">
      <Logo />
      {APP_NAME}
    </p>
  );
}

export default AppBrand;
