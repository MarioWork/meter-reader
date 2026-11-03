import { Link, useRouteError } from 'react-router';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import AppBrand from '@components/AppBrand';
import RouteErrorActions from './components/RouteErrorActions';
import RouteErrorFigure from './components/RouteErrorFigure';
import { ROUTE_ERROR_COPY, routeErrorKindOf } from './routeErrorUtils';

// The one error boundary, on the root route: an unknown address, a failed loader or a failed chunk lands here,
// outside the signed-in layout. A 404 gets the puzzled meter; anything else gets the dizzy one and a reload. The
// error itself is never shown: it can carry request details.
function RouteError() {
  const kind = routeErrorKindOf(useRouteError());
  const copy = ROUTE_ERROR_COPY[kind];

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-4">
      <Link
        to={BASE_ROUTES_PATHS.HOME}
        className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <AppBrand />
      </Link>
      <section className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl bg-card p-8 text-center shadow-sm ring-1 ring-foreground/10">
        <RouteErrorFigure kind={kind} label={copy.label} />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
          <p className="text-sm text-balance text-muted-foreground">{copy.description}</p>
        </div>
        <RouteErrorActions kind={kind} />
      </section>
    </main>
  );
}

export default RouteError;
