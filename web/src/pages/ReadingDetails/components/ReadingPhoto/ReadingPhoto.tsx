import { ImageOffIcon, Maximize2Icon } from 'lucide-react';
import { useRef, useState } from 'react';
import PhotoFrame from '@components/PhotoFrame';
import { formatIsoDate } from '@utils/dateUtils';
import { getPhotoUrl } from '@utils/readingPhotoUtils';
import FullScreenPhoto from './components/FullScreenPhoto';
import { useReading } from '../../hooks/useReading';

const NO_PHOTO_LABEL = 'No photo';
const OPEN_LABEL = 'Open the photo full screen';
const PHOTO_DESCRIPTION = 'The meter showing';
const FULL_SCREEN_TITLE = 'Photo of the reading of';

// The photo the reading was taken from, shown large; a tap or click anywhere on it opens it full screen. Saved
// without one, a quiet line says so.
function ReadingPhoto() {
  const reading = useReading();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  if (reading.photoId === null) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <ImageOffIcon aria-hidden="true" className="size-4" />
        {NO_PHOTO_LABEL}
      </p>
    );
  }

  const readingDate = formatIsoDate(reading.date);
  const photoUrl = getPhotoUrl(reading.photoId);
  const photoDescription = `${PHOTO_DESCRIPTION} ${reading.digits} on ${readingDate}`;

  return (
    <div className="relative">
      {/* Keyed by the photo: Previous and Next keep this page mounted, and a new photo starts its own loading. */}
      <PhotoFrame key={photoUrl} photoUrl={photoUrl} photoDescription={photoDescription} className="w-full" />
      {/* Over the whole photo, so the photo itself is the target; its corner icon says what a tap does. */}
      <button
        ref={openButtonRef}
        type="button"
        aria-label={OPEN_LABEL}
        title={OPEN_LABEL}
        onClick={() => setIsFullScreen(true)}
        className="absolute inset-0 cursor-zoom-in rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="absolute right-2 bottom-2 rounded-md bg-background/80 p-1.5 text-foreground shadow-sm">
          <Maximize2Icon aria-hidden="true" className="size-4" />
        </span>
      </button>
      <FullScreenPhoto
        isOpen={isFullScreen}
        title={`${FULL_SCREEN_TITLE} ${readingDate}`}
        photoUrl={photoUrl}
        photoDescription={photoDescription}
        returnFocusRef={openButtonRef}
        onClose={() => setIsFullScreen(false)}
      />
    </div>
  );
}

export default ReadingPhoto;
