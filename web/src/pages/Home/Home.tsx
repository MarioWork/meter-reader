import { Link } from 'react-router';
import { ITEM_ROUTES_PATHS } from '@application/routes/routesUtils';
import SignOutButton from './components/SignOutButton';

function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <span className="text-lg font-semibold">Meter Reader</span>
        <SignOutButton />
      </header>
      <main className="flex flex-col gap-4 p-6">
        <h1 className="text-2xl font-bold">Hello world</h1>
        <Link
          to={ITEM_ROUTES_PATHS.BASE}
          className="self-start text-blue-700 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          See the items example
        </Link>
      </main>
    </div>
  );
}

export default Home;
