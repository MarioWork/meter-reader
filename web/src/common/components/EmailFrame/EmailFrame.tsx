import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

// The box an email is shown in, laid out like a message: one kept from a send, or one previewed before any.
function EmailFrame({ children }: Props) {
  return <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3 text-sm">{children}</div>;
}

export default EmailFrame;
