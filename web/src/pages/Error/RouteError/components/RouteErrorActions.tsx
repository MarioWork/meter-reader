import { HouseIcon, RotateCwIcon } from 'lucide-react';
import { Link } from 'react-router';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { Button, buttonVariants } from '@components/ui/button';
import type { RouteErrorKind } from '../routeErrorUtils';

type Props = {
  kind: RouteErrorKind;
};

const HOME_LABEL = 'Back to home';
const RETRY_LABEL = 'Try again';

// Not found: the way home. Broken: a reload first, since the page itself may be fine a moment later, then home.
function RouteErrorActions({ kind }: Props) {
  const canRetry = kind === 'broken';

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {canRetry && (
        <Button onClick={() => window.location.reload()}>
          <RotateCwIcon aria-hidden="true" />
          {RETRY_LABEL}
        </Button>
      )}
      <Link to={BASE_ROUTES_PATHS.HOME} className={buttonVariants({ variant: canRetry ? 'outline' : 'default' })}>
        <HouseIcon aria-hidden="true" />
        {HOME_LABEL}
      </Link>
    </div>
  );
}

export default RouteErrorActions;
