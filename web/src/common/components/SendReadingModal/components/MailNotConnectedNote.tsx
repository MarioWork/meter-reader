import { TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';

// Why Send is off. role="status" (over the Alert's own role="alert") reads it out politely, without interrupting.
function MailNotConnectedNote() {
  return (
    <Alert variant="warning" role="status">
      <TriangleAlertIcon />
      <AlertTitle>Hotmail is not connected</AlertTitle>
      <AlertDescription>
        The reading can&apos;t be sent until you run{' '}
        <code className="rounded-sm bg-warning/20 px-1 font-mono">yarn mail:connect</code> on the server.
      </AlertDescription>
    </Alert>
  );
}

export default MailNotConnectedNote;
