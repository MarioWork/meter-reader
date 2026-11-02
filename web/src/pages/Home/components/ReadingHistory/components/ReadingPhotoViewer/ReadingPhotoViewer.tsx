import { useState } from 'react';
import type { ReadingApiModel } from '@app-types/models';
import { formatIsoDate } from '@utils/dateUtils';
import { getPhotoUrl } from '@pages/Home/readingPhotoUtils';
import PhotoDialog from './components/PhotoDialog';

type Props = {
  reading: ReadingApiModel;
};

const PREVIEW_SIZE_PX = 48;
const NO_PHOTO_LABEL = 'No photo';
const SHOW_PHOTO_LABEL = 'Show the photo of';
const DIALOG_TITLE = 'Photo of';
const PHOTO_DESCRIPTION = 'The meter showing';

// A small preview; tapping it shows the full photo inside the app. Not a new tab: an app added to an iPhone's home
// screen would open it in Safari, which has no session, so the photo would not load.
function ReadingPhotoViewer({ reading }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (reading.photoId === null) return <span className="text-muted-foreground">{NO_PHOTO_LABEL}</span>;

  const photoUrl = getPhotoUrl(reading.photoId);
  const description = `${reading.digits} on ${formatIsoDate(reading.date)}`;

  return (
    <>
      {/* The preview is the control, so it is a plain button around the photo, not the text Button. */}
      <button
        type="button"
        aria-label={`${SHOW_PHOTO_LABEL} ${description}`}
        onClick={() => setIsOpen(true)}
        className="block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <img
          src={photoUrl}
          alt=""
          width={PREVIEW_SIZE_PX}
          height={PREVIEW_SIZE_PX}
          loading="lazy"
          className="size-12 rounded-sm border border-input object-cover"
        />
      </button>
      <PhotoDialog
        isOpen={isOpen}
        title={`${DIALOG_TITLE} ${description}`}
        photoUrl={photoUrl}
        photoDescription={`${PHOTO_DESCRIPTION} ${description}`}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

export default ReadingPhotoViewer;
