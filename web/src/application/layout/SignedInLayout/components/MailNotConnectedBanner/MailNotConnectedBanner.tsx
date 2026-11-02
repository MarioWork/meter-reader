// Readings cannot be sent until Hotmail is connected, and only the server can do that (ADR 0001). role="status"
// reads it out politely, without interrupting.
function MailNotConnectedBanner() {
  return (
    <p role="status" className="border-b border-warning bg-warning/10 px-6 py-3 text-foreground">
      Hotmail not connected: readings can&apos;t be sent until you run{' '}
      <code className="rounded-sm bg-warning/20 px-1 font-mono">yarn mail:connect</code> on the server (README,
      &ldquo;Connecting Hotmail&rdquo;).
    </p>
  );
}

export default MailNotConnectedBanner;
