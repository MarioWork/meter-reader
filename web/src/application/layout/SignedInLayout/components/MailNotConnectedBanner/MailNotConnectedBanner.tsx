import { TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';

// Readings cannot be sent until Hotmail is connected, and only the server can do that (ADR 0001). role="status"
// (over the Alert's own role="alert") reads it out politely, without interrupting. Centred above the page on a phone;
// from lg as wide as the page's tiles, so the line under the title fits on one row.
function MailNotConnectedBanner() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-4 sm:px-6 lg:max-w-none lg:px-8 lg:pt-6">
      <Alert variant="warning" role="status">
        <TriangleAlertIcon />
        <AlertTitle>Hotmail not connected</AlertTitle>
        <AlertDescription>
          Readings can&apos;t be sent until Hotmail is connected on the server: follow{' '}
          <code className="rounded-sm bg-warning/20 px-1 font-mono">docs/guide/hotmail.md</code>.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default MailNotConnectedBanner;
