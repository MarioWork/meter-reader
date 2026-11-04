import { ImageOffIcon } from 'lucide-react';
import EmptyMeter from '@components/EmptyMeter';
import { Card } from '@components/ui/card';
import { cn } from '@utils/classNameUtils';

type Props = {
  // The frame's size, when the page stretches it.
  className?: string;
};

const NO_PHOTO_LABEL = 'No photo';

// Where the photo would be, for a reading saved without one: the same frame as a photo, so the page keeps its shape,
// with the app's blank meter and a crossed-out picture on it, like the other empty states. A Card, so it matches the
// cards beside it.
function NoPhotoTile({ className }: Props) {
  return (
    <Card className={cn('aspect-4/3 max-h-[70vh] w-full items-center justify-center gap-4 py-0', className)}>
      <EmptyMeter BadgeIcon={ImageOffIcon} />
      <p className="text-sm text-muted-foreground">{NO_PHOTO_LABEL}</p>
    </Card>
  );
}

export default NoPhotoTile;
