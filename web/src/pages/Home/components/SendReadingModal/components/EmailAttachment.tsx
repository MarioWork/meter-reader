import { ImageOffIcon } from 'lucide-react';
import { useId } from 'react';
import type { ReadingEmailAttachmentApiModel } from '@app-types/models';
import { Switch } from '@components/ui/switch';
import { getPhotoUrl } from '@pages/Home/readingPhotoUtils';
import { cn } from '@utils/classNameUtils';

type Props = {
  attachment: ReadingEmailAttachmentApiModel | null;
  isAttachingPhoto: boolean;
  isDisabled: boolean;
  onAttachingPhotoChange: (isAttachingPhoto: boolean) => void;
};

const PREVIEW_SIZE_PX = 64;
const NO_PHOTO_LABEL = 'No photo to attach';
const ATTACH_PHOTO_LABEL = 'Attach photo';

// One row: the photo, its file name and the "Attach photo" switch. The photo fades while it is left out, so the
// switch's state shows twice. Its alt text is the file name the provider will see.
function EmailAttachment({ attachment, isAttachingPhoto, isDisabled, onAttachingPhotoChange }: Props) {
  const switchId = useId();

  if (!attachment) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        <ImageOffIcon aria-hidden="true" className="size-4" />
        {NO_PHOTO_LABEL}
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
      <img
        src={getPhotoUrl(attachment.photoId)}
        alt={attachment.name}
        width={PREVIEW_SIZE_PX}
        height={PREVIEW_SIZE_PX}
        className={cn('size-16 rounded-md border object-cover transition-opacity', !isAttachingPhoto && 'opacity-30')}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <label htmlFor={switchId} className="text-sm font-medium">
          {ATTACH_PHOTO_LABEL}
        </label>
        <span className="truncate text-xs text-muted-foreground">{attachment.name}</span>
      </div>
      <Switch id={switchId} checked={isAttachingPhoto} disabled={isDisabled} onCheckedChange={onAttachingPhotoChange} />
    </div>
  );
}

export default EmailAttachment;
