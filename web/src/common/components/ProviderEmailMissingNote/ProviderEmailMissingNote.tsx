import { TriangleAlertIcon } from 'lucide-react';
import { Link } from 'react-router';
import { SETTINGS_ROUTES_PATHS } from '@application/routes/routesUtils';
import { Alert, AlertTitle } from '@components/ui/alert';

// Why Send is off while no provider address is saved. role="status" (over the Alert's own role="alert") reads it out
// politely, without interrupting.
function ProviderEmailMissingNote() {
  return (
    <Alert variant="warning" role="status">
      <TriangleAlertIcon />
      <AlertTitle>
        Set the provider&apos;s address in{' '}
        <Link
          to={SETTINGS_ROUTES_PATHS.BASE}
          className="underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Settings
        </Link>
        .
      </AlertTitle>
    </Alert>
  );
}

export default ProviderEmailMissingNote;
