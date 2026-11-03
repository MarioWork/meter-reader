import { useState } from 'react';
import { ScanTextIcon } from 'lucide-react';
import { Button } from '@components/ui/button';
import { DEFAULT_CROP, moveBox, resizeBox, turnCropLeft, turnCropRight, WHOLE_PHOTO } from '../../../../photoCropUtils';
import type { CropBox, PhotoCrop } from '../../../../types';
import CropControls from './components/CropControls';
import CropFrame from './components/CropFrame';

type Props = {
  previewUrl: string;
  // Read the marked part, or WHOLE_PHOTO when the user skips the crop.
  onRead: (crop: PhotoCrop) => void;
};

const LEGEND = 'Mark the digit window';
const HINT_ID = 'photo-crop-hint';
const HINT =
  'Turn the photo until the digits read left to right. Drag on it to draw a box round the digits, or move and ' +
  'size the box with the buttons. Only the box is read; the whole photo is saved.';

// The step between picking the photo and reading the number from it: OCR reads a small, sideways meter far better
// once it is cut down to its digit window and turned upright. The photo that is saved stays whole.
function CropStep({ previewUrl, onRead }: Props) {
  const [crop, setCrop] = useState<PhotoCrop>(DEFAULT_CROP);

  function setBox(box: CropBox) {
    setCrop({ ...crop, box });
  }

  return (
    <fieldset aria-describedby={HINT_ID} className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-medium">{LEGEND}</legend>
      <p id={HINT_ID} className="text-sm text-muted-foreground">
        {HINT}
      </p>
      <CropFrame previewUrl={previewUrl} crop={crop} onBoxChange={setBox} />
      <CropControls
        onTurnLeft={() => setCrop(turnCropLeft(crop))}
        onTurnRight={() => setCrop(turnCropRight(crop))}
        onMove={(by) => setBox(moveBox(crop.box, by))}
        onResize={(by) => setBox(resizeBox(crop.box, by))}
      />
      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={() => onRead(crop)}>
          <ScanTextIcon data-icon="inline-start" aria-hidden />
          Read the number
        </Button>
        <Button variant="ghost" size="lg" onClick={() => onRead(WHOLE_PHOTO)}>
          Skip crop, read whole photo
        </Button>
      </div>
    </fieldset>
  );
}

export default CropStep;
