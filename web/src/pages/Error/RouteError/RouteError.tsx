import { Link } from 'react-router';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { buttonVariants } from '@components/ui/button';

function RouteError() {
  return (
    <main className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Page not available</h1>
      <p>Something went wrong. Please try again.</p>
      <Link className={buttonVariants({ variant: 'link' })} to={BASE_ROUTES_PATHS.HOME}>
        Back to home
      </Link>
    </main>
  );
}

export default RouteError;
