import { CameraIcon, ImageIcon, KeyboardIcon } from 'lucide-react';
import { Button } from '@components/ui/button';
import PhotoDigitsStatus from './components/PhotoDigitsStatus';
import PhotoInput from './components/PhotoInput';

type Props = {
  previewUrl?: string;
  isShrinking: boolean;
  // OCR is still reading the number from the last photo.
  isFindingDigits: boolean;
  // OCR found no number in the last photo.
  hasFoundNothing: boolean;
  errorMessage?: string;
  onPick: (photo: File) => void;
  onRemove: () => void;
  // The user types the reading in without a photo.
  onSkip: () => void;
};

const CAMERA_INPUT_ID = 'reading-photo-camera';
const FILE_INPUT_ID = 'reading-photo-file';
const ERROR_ID = 'reading-photo-error';

// Optional, but first on the page: take the photo with the camera, or pick one already on the device. Either way it
// is shrunk first, then the number in it is read into the Reading field. The camera stays in the same place in the
// page once a photo shows, so keyboard focus is not lost when it shrinks to a button.
function PhotoPicker({
  previewUrl,
  isShrinking,
  isFindingDigits,
  hasFoundNothing,
  errorMessage,
  onPick,
  onRemove,
  onSkip,
}: Props) {
  const errorId = errorMessage ? ERROR_ID : undefined;
  const hasPhoto = previewUrl !== undefined;
  // A new photo, or removing this one, waits until the last one is shrunk and read.
  const isBusy = isShrinking || isFindingDigits;

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-sm font-medium">Photo (optional)</legend>
      {hasPhoto && (
        <img
          src={previewUrl}
          alt="The meter, as it will be saved"
          className="max-h-72 w-full rounded-lg border border-input object-contain"
        />
      )}
      <div className="flex flex-wrap gap-2">
        <PhotoInput
          id={CAMERA_INPUT_ID}
          label="Take a photo"
          icon={CameraIcon}
          isCamera
          isLarge={!hasPhoto}
          isDisabled={isBusy}
          describedById={errorId}
          onPick={onPick}
        />
        <PhotoInput
          id={FILE_INPUT_ID}
          label="Choose a photo"
          icon={ImageIcon}
          isDisabled={isBusy}
          describedById={errorId}
          onPick={onPick}
        />
        {hasPhoto && (
          <Button variant="outline" size="lg" disabled={isBusy} onClick={onRemove}>
            Remove photo
          </Button>
        )}
        {!hasPhoto && (
          <Button variant="ghost" size="lg" onClick={onSkip}>
            <KeyboardIcon data-icon="inline-start" />
            Skip photo, type it
          </Button>
        )}
      </div>
      <PhotoDigitsStatus isFindingDigits={isFindingDigits} hasFoundNothing={hasFoundNothing} />
      {isShrinking && <p role="status">Shrinking the photo…</p>}
      {errorMessage && (
        <p id={ERROR_ID} role="alert" className="text-destructive">
          {errorMessage}
        </p>
      )}
    </fieldset>
  );
}

export default PhotoPicker;
