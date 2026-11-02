import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import TextLink from '@components/TextLink';

function RouteError() {
  return (
    <main className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Page not available</h1>
      <p>Something went wrong. Please try again.</p>
      <TextLink to={BASE_ROUTES_PATHS.HOME}>Back to home</TextLink>
    </main>
  );
}

export default RouteError;
