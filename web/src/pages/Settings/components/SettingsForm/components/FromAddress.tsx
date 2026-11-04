type Props = {
  from: string | null;
};

const NOT_SET_LABEL = 'Not set';
const HINT_START = 'Set on the server: mail goes out from the Hotmail account ';
const CONNECT_COMMAND = 'yarn mail:connect';
const HINT_END = ' signed in with. Connect another one to change it.';

// "From" is the connected Microsoft account, so it is shown, never edited. MAIL_FROM on the server is its label.
function FromAddress({ from }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 text-sm">
        <dt className="font-medium">From</dt>
        <dd className="break-all text-muted-foreground">{from ?? NOT_SET_LABEL}</dd>
      </dl>
      <p className="text-sm text-muted-foreground">
        {HINT_START}
        <code className="font-mono">{CONNECT_COMMAND}</code>
        {HINT_END}
      </p>
    </div>
  );
}

export default FromAddress;
