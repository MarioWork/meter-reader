import { useId } from 'react';
import type { ReadingEmailAttachmentApiModel } from '@app-types/models';
import { Field, FieldLabel } from '@components/ui/field';
import { Switch } from '@components/ui/switch';
import { getPhotoUrl } from '@pages/Home/readingPhotoUtils';

type Props = {
  attachment: ReadingEmailAttachmentApiModel | null;
  isAttachingPhoto: boolean;
  isDisabled: boolean;
  onAttachingPhotoChange: (isAttachingPhoto: boolean) => void;
};

const PREVIEW_SIZE_PX = 96;
const NO_PHOTO_LABEL = 'No photo';
const ATTACH_PHOTO_LABEL = 'Attach photo';

// The "Attach photo" toggle, only when the reading has a photo, and the photo itself while it is attached. Its alt
// text is the file name the provider will see.
function EmailAttachment({ attachment, isAttachingPhoto, isDisabled, onAttachingPhotoChange }: Props) {
  const switchId = useId();

  if (!attachment) return <span className="text-muted-foreground">{NO_PHOTO_LABEL}</span>;

  return (
    <div className="flex flex-col gap-2">
      <Field orientation="horizontal">
        <Switch
          id={switchId}
          checked={isAttachingPhoto}
          disabled={isDisabled}
          onCheckedChange={onAttachingPhotoChange}
        />
        <FieldLabel htmlFor={switchId}>{ATTACH_PHOTO_LABEL}</FieldLabel>
      </Field>
      {isAttachingPhoto && (
        <img
          src={getPhotoUrl(attachment.photoId)}
          alt={attachment.name}
          width={PREVIEW_SIZE_PX}
          height={PREVIEW_SIZE_PX}
          className="size-24 rounded-sm border border-input object-cover"
        />
      )}
    </div>
  );
}

export default EmailAttachment;
