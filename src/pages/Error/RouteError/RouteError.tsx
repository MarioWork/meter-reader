import { Link } from 'react-router';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';

function RouteError() {
  return (
    <main className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Page not available</h1>
      <p>Something went wrong. Please try again.</p>
      <Link
        to={BASE_ROUTES_PATHS.HOME}
        className="self-start text-blue-700 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      >
        Back to home
      </Link>
    </main>
  );
}

export default RouteError;
