import { Outlet } from 'react-router';
import SignOutButton from './components/SignOutButton';

// The signed-in part of the app: the header with sign-out on every page. Its loader sends anyone else to setup or
// the login page.
function SignedInLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <span className="text-lg font-semibold">Meter Reader</span>
        <SignOutButton />
      </header>
      <Outlet />
    </div>
  );
}

export default SignedInLayout;
