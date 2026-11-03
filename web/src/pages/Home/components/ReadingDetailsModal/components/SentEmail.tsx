import { PaperclipIcon } from 'lucide-react';
import type { SentEmailApiModel } from '@app-types/models';
import EmailAddresses from '@components/EmailAddresses';
import EmailFrame from '@components/EmailFrame';
import type { DetailsPhoto } from '../readingDetailsUtils';
import PhotoReveal from './PhotoReveal';

const PHOTO_ATTACHED_LABEL = 'Photo attached';
const NO_PHOTO_LABEL = 'Sent without the photo';

type Props = {
  sentEmail: SentEmailApiModel;
  // The reading's photo, when it still has one to show.
  photo?: DetailsPhoto;
};

// The kept email laid out like a message: who it went to, the subject, the body, and whether the photo went with it.
// "Photo attached" shows the photo when tapped.
function SentEmail({ sentEmail, photo }: Props) {
  const canShowPhoto = sentEmail.hasPhoto && photo !== undefined;

  return (
    <EmailFrame>
      <EmailAddresses from={sentEmail.from} to={sentEmail.to} />
      <p className="font-medium">{sentEmail.subject}</p>
      <p className="border-t pt-3 font-mono whitespace-pre-wrap">{sentEmail.body}</p>
      {canShowPhoto ? (
        <PhotoReveal
          label={PHOTO_ATTACHED_LABEL}
          Icon={PaperclipIcon}
          photoUrl={photo.url}
          photoDescription={photo.description}
        />
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <PaperclipIcon aria-hidden="true" className="size-3.5" />
          {sentEmail.hasPhoto ? PHOTO_ATTACHED_LABEL : NO_PHOTO_LABEL}
        </p>
      )}
    </EmailFrame>
  );
}

export default SentEmail;
