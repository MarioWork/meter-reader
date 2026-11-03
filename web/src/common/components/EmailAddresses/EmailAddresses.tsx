import { cn } from '@utils/classNameUtils';

type Props = {
  // The user's own address; the row is left out when the server has none.
  from: string | null;
  // The provider's address; null while none is saved in Settings.
  to: string | null;
  className?: string;
};

const LABEL_CLASSES = 'text-muted-foreground';
const NOT_SET_LABEL = 'Not set';

// Who an email is from and who it goes to, as two labelled rows, the way a mail app shows them.
function EmailAddresses({ from, to, className }: Props) {
  return (
    <dl className={cn('grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm', className)}>
      {from && (
        <>
          <dt className={LABEL_CLASSES}>From</dt>
          <dd className="break-all">{from}</dd>
        </>
      )}
      <dt className={LABEL_CLASSES}>To</dt>
      <dd className="break-all">{to ?? NOT_SET_LABEL}</dd>
    </dl>
  );
}

export default EmailAddresses;
