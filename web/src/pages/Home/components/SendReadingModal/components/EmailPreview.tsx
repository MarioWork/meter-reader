import type { ReadingEmailApiModel } from '@app-types/models';
import EmailAttachment from './EmailAttachment';

type Props = {
  email: ReadingEmailApiModel;
  isAttachingPhoto: boolean;
  isDisabled: boolean;
  onAttachingPhotoChange: (isAttachingPhoto: boolean) => void;
};

const FIELD_LABEL_CLASSES = 'font-semibold text-muted-foreground';

// The email as the provider will get it: every field comes from the server, nothing is retyped here.
function EmailPreview({ email, isAttachingPhoto, isDisabled, onAttachingPhotoChange }: Props) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
      <dt className={FIELD_LABEL_CLASSES}>To</dt>
      <dd className="break-all">{email.to}</dd>
      <dt className={FIELD_LABEL_CLASSES}>Subject</dt>
      <dd>{email.subject}</dd>
      <dt className={FIELD_LABEL_CLASSES}>Body</dt>
      <dd className="font-mono whitespace-pre-wrap">{email.body}</dd>
      <dt className={FIELD_LABEL_CLASSES}>Photo</dt>
      <dd>
        <EmailAttachment
          attachment={email.attachment}
          isAttachingPhoto={isAttachingPhoto}
          isDisabled={isDisabled}
          onAttachingPhotoChange={onAttachingPhotoChange}
        />
      </dd>
    </dl>
  );
}

export default EmailPreview;
