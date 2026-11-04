import { Maximize2Icon } from 'lucide-react';
import { useRef, useState } from 'react';
import PhotoFrame from '@components/PhotoFrame';
import { Card } from '@components/ui/card';
import { cn } from '@utils/classNameUtils';
import { formatIsoDate } from '@utils/dateUtils';
import { getPhotoUrl } from '@utils/readingPhotoUtils';
import FullScreenPhoto from './components/FullScreenPhoto';
import NoPhotoTile from './components/NoPhotoTile';
import { useReading } from '../../hooks/useReading';

type Props = {
  // From lg, as tall as the column beside it, the photo shown whole inside; otherwise its own 4:3 frame.
  isStretched?: boolean;
};

// The frame's look when it stretches to the row's height.
const STRETCHED_FRAME_CLASS = 'lg:aspect-auto lg:h-full lg:max-h-none';

const OPEN_LABEL = 'Open the photo full screen';
const PHOTO_DESCRIPTION = 'The meter showing';
const FULL_SCREEN_TITLE = 'Photo of the reading of';

// The photo the reading was taken from, shown large; a tap or click anywhere on it opens it full screen. Saved
// without one, a tile of the same size says so.
function ReadingPhoto({ isStretched = false }: Props) {
  const reading = useReading();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  const stretchedClass = isStretched ? STRETCHED_FRAME_CLASS : undefined;

  if (reading.photoId === null) return <NoPhotoTile className={stretchedClass} />;

  const readingDate = formatIsoDate(reading.date);
  const photoUrl = getPhotoUrl(reading.photoId);
  const photoDescription = `${PHOTO_DESCRIPTION} ${reading.digits} on ${readingDate}`;

  return (
    // A Card, like the cards beside it, behind the photo's own margins.
    <Card className={cn('relative p-0', isStretched && 'lg:h-full')}>
      {/* Keyed by the photo: Previous and Next keep this page mounted, and a new photo starts its own loading. */}
      <PhotoFrame
        key={photoUrl}
        photoUrl={photoUrl}
        photoDescription={photoDescription}
        className={cn('w-full rounded-none bg-transparent', stretchedClass)}
      />
      {/* Over the whole photo, so the photo itself is the target; its corner icon says what a tap does. */}
      <button
        ref={openButtonRef}
        type="button"
        aria-label={OPEN_LABEL}
        title={OPEN_LABEL}
        onClick={() => setIsFullScreen(true)}
        className="absolute inset-0 cursor-zoom-in rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
    </Card>
  );
}

export default ReadingPhoto;
