import { useState } from 'react';
import { cn } from '@utils/classNameUtils';
import { isSidewaysTurn, turnedSize } from '../../../../../photoCropUtils';
import type { PhotoSize } from '@utils/photoShrinkUtils';
import type { CropBox, PhotoCrop, QuarterTurn } from '../../../../../types';
import { useCropDrag } from '../hooks/useCropDrag';

type Props = {
  previewUrl: string;
  crop: PhotoCrop;
  onBoxChange: (box: CropBox) => void;
};

// A camera's shape, until the photo has loaded and its own size is known.
const SIZE_BEFORE_LOAD: PhotoSize = { width: 4, height: 3 };
const PERCENT = 100;

// Tailwind's own rotate utilities, so the turn is a class and not a style.
const TURN_CLASSES: Record<QuarterTurn, string> = {
  0: 'rotate-0',
  90: 'rotate-90',
  180: 'rotate-180',
  270: 'rotate-270',
};

function asPercent(fraction: number): string {
  return `${fraction * PERCENT}%`;
}

// The photo's size inside the frame, before it is turned: a quarter turn swaps its sides, so it is drawn as tall as
// the frame is wide, and as wide as the frame is high.
function photoStyleFor(frame: PhotoSize, turn: QuarterTurn): React.CSSProperties {
  if (!isSidewaysTurn(turn)) return { width: asPercent(1), height: asPercent(1) };

  return { width: asPercent(frame.height / frame.width), height: asPercent(frame.width / frame.height) };
}

function boxStyleFor(box: CropBox): React.CSSProperties {
  return { left: asPercent(box.x), top: asPercent(box.y), width: asPercent(box.width), height: asPercent(box.height) };
}

// The photo, turned as it will be read, with the box over the digit window. Dragging on it draws or moves the box;
// the buttons beside it do the same without dragging. The frame takes the turned photo's shape.
function CropFrame({ previewUrl, crop, onBoxChange }: Props) {
  const [photoSize, setPhotoSize] = useState<PhotoSize>(SIZE_BEFORE_LOAD);
  const dragHandlers = useCropDrag(crop.box, onBoxChange);
  const frame = turnedSize(photoSize, crop.turn);

  function rememberSize(event: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = event.currentTarget;

    setPhotoSize({ width: naturalWidth, height: naturalHeight });
  }

  return (
    <div
      className="relative mx-auto w-full max-w-md touch-none overflow-hidden rounded-lg border border-input select-none"
      style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
      {...dragHandlers}
    >
      <img
        src={previewUrl}
        alt="The meter, turned as it will be read"
        draggable={false}
        onLoad={rememberSize}
        className={cn('absolute top-1/2 left-1/2 max-w-none -translate-1/2', TURN_CLASSES[crop.turn])}
        style={photoStyleFor(frame, crop.turn)}
      />
      <div
        aria-hidden
        className="absolute rounded-sm border-2 border-primary bg-primary/15"
        style={boxStyleFor(crop.box)}
      />
    </div>
  );
}

export default CropFrame;
