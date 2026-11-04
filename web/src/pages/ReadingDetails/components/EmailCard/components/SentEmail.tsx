import { PaperclipIcon } from 'lucide-react';
import type { SentEmailApiModel } from '@app-types/models';
import EmailAddresses from '@components/EmailAddresses';
import EmailFrame from '@components/EmailFrame';

const PHOTO_ATTACHED_LABEL = 'Photo attached';
const NO_PHOTO_LABEL = 'Sent without the photo';

type Props = {
  sentEmail: SentEmailApiModel;
};

// The kept email laid out like a message: who it went to, the subject, the body, and whether the photo went with it.
// The photo itself is the one shown large on the page.
function SentEmail({ sentEmail }: Props) {
  return (
    <EmailFrame>
      <EmailAddresses from={sentEmail.from} to={sentEmail.to} />
      <p className="font-medium">{sentEmail.subject}</p>
      <p className="border-t pt-3 font-mono whitespace-pre-wrap">{sentEmail.body}</p>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <PaperclipIcon aria-hidden="true" className="size-3.5" />
        {sentEmail.hasPhoto ? PHOTO_ATTACHED_LABEL : NO_PHOTO_LABEL}
      </p>
    </EmailFrame>
  );
}

export default SentEmail;
