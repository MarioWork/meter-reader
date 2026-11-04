import { ImageOffIcon } from 'lucide-react';
import { useState } from 'react';
import LoadingDigits from '@components/LoadingDigits';
import { cn } from '@utils/classNameUtils';

type Props = {
  photoUrl: string;
  photoDescription: string;
  // The frame's width, which the caller decides; it defaults to most of the screen, up to 40rem.
  className?: string;
};

type PhotoState = 'loading' | 'loaded' | 'failed';

const LOADING_LABEL = 'Loading the photo…';
const FAILED_LABEL = "The photo couldn't be loaded.";

// A fixed frame, so the dialog keeps its size while the photo loads instead of jumping when it arrives. Mounted only
// while the dialog is open, so each opening starts loading afresh.
function PhotoFrame({ photoUrl, photoDescription, className }: Props) {
  const [photoState, setPhotoState] = useState<PhotoState>('loading');

  const isLoading = photoState === 'loading';
  const hasFailed = photoState === 'failed';

  return (
    <div
      className={cn(
        'relative flex aspect-4/3 max-h-[70vh] w-[min(90vw,40rem)] items-center justify-center overflow-hidden rounded-lg bg-muted',
        className,
      )}
    >
      {isLoading && (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoadingDigits />
          {LOADING_LABEL}
        </p>
      )}
      {hasFailed && (
        <p role="alert" className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageOffIcon aria-hidden="true" className="size-4" />
          {FAILED_LABEL}
        </p>
      )}
      <img
        src={photoUrl}
        alt={photoDescription}
        onLoad={() => setPhotoState('loaded')}
        onError={() => setPhotoState('failed')}
        className={cn(
          'absolute inset-0 size-full object-contain motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out',
          isLoading || hasFailed ? 'opacity-0' : 'opacity-100',
        )}
      />
    </div>
  );
}

export default PhotoFrame;
