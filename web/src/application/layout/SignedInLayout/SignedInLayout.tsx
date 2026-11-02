import { Outlet } from 'react-router';

// The signed-in part of the app. Its loader sends anyone else to setup or the login page.
function SignedInLayout() {
  return <Outlet />;
}

export default SignedInLayout;
