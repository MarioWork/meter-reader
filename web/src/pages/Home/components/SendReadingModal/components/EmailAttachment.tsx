import type { ReadingEmailAttachmentApiModel } from '@app-types/models';
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
  if (!attachment) return <span className="text-gray-600">{NO_PHOTO_LABEL}</span>;

  return (
    <div className="flex flex-col gap-2">
      <label className="flex min-h-6 items-center gap-2">
        <input
          type="checkbox"
          checked={isAttachingPhoto}
          disabled={isDisabled}
          onChange={(event) => onAttachingPhotoChange(event.target.checked)}
          className="size-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        />
        {ATTACH_PHOTO_LABEL}
      </label>
      {isAttachingPhoto && (
        <img
          src={getPhotoUrl(attachment.photoId)}
          alt={attachment.name}
          width={PREVIEW_SIZE_PX}
          height={PREVIEW_SIZE_PX}
          className="size-24 rounded-sm border border-gray-300 object-cover"
        />
      )}
    </div>
  );
}

export default EmailAttachment;
