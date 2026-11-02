import { Link } from 'react-router';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import StandalonePage from '@components/StandalonePage';
import { buttonVariants } from '@components/ui/button';

function RouteError() {
  return (
    <StandalonePage
      title="Page not available"
      description="This page doesn't exist, or something went wrong while opening it."
    >
      <Link className={buttonVariants()} to={BASE_ROUTES_PATHS.HOME}>
        Back to home
      </Link>
    </StandalonePage>
  );
}

export default RouteError;
