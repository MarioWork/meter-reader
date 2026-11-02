import { Button } from '@components/ui/button';
import PhotoInput from './components/PhotoInput';

type Props = {
  previewUrl?: string;
  isShrinking: boolean;
  // OCR is still reading the number from the last photo.
  isFindingDigits: boolean;
  errorMessage?: string;
  onPick: (photo: File) => void;
  onRemove: () => void;
};

const CAMERA_INPUT_ID = 'reading-photo-camera';
const FILE_INPUT_ID = 'reading-photo-file';
const ERROR_ID = 'reading-photo-error';

// Optional: take the photo with the camera, or pick one already on the device. Either way it is shrunk first,
// then the number in it is read into the Reading field.
function PhotoPicker({ previewUrl, isShrinking, isFindingDigits, errorMessage, onPick, onRemove }: Props) {
  const errorId = errorMessage ? ERROR_ID : undefined;
  // A new photo, or removing this one, waits until the last one is shrunk and read.
  const isBusy = isShrinking || isFindingDigits;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1">Photo (optional)</legend>
      {previewUrl && (
        <img
          src={previewUrl}
          alt="The meter, as it will be saved"
          className="max-h-48 self-start rounded-sm border border-input"
        />
      )}
      <div className="flex flex-wrap gap-2">
        <PhotoInput
          id={CAMERA_INPUT_ID}
          label="Take a photo"
          isCamera
          isDisabled={isBusy}
          describedById={errorId}
          onPick={onPick}
        />
        <PhotoInput
          id={FILE_INPUT_ID}
          label="Choose a photo"
          isDisabled={isBusy}
          describedById={errorId}
          onPick={onPick}
        />
        {previewUrl && (
          <Button variant="outline" disabled={isBusy} onClick={onRemove}>
            Remove photo
          </Button>
        )}
      </div>
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
