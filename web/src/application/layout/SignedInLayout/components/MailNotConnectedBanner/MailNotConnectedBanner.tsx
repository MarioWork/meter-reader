import { TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';

// Readings cannot be sent until Hotmail is connected, and only the server can do that (ADR 0001). role="status"
// (over the Alert's own role="alert") reads it out politely, without interrupting. Centred above the page, as wide as
// the widest page column, on a phone and beside the sidebar alike.
function MailNotConnectedBanner() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-4 sm:px-6">
      <Alert variant="warning" role="status">
        <TriangleAlertIcon />
        <AlertTitle>Hotmail not connected</AlertTitle>
        <AlertDescription>
          Readings can&apos;t be sent until you run{' '}
          <code className="rounded-sm bg-warning/20 px-1 font-mono">yarn mail:connect</code> on the server (README,
          &ldquo;Connecting Hotmail&rdquo;).
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default MailNotConnectedBanner;
