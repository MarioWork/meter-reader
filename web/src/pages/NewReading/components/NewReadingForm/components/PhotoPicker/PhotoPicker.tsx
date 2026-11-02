import Button from '@components/Button';
import PhotoInput from './components/PhotoInput';

type Props = {
  previewUrl?: string;
  // Shrinking or reading the last photo: a new one waits until that is done.
  isBusy: boolean;
  isShrinking: boolean;
  errorMessage?: string;
  onPick: (photo: File) => void;
  onRemove: () => void;
};

const CAMERA_INPUT_ID = 'reading-photo-camera';
const FILE_INPUT_ID = 'reading-photo-file';
const ERROR_ID = 'reading-photo-error';

// Optional: take the photo with the camera, or pick one already on the device. Either way it is shrunk first,
// then the number in it is read into the Reading field.
function PhotoPicker({ previewUrl, isBusy, isShrinking, errorMessage, onPick, onRemove }: Props) {
  const errorId = errorMessage ? ERROR_ID : undefined;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1">Photo (optional)</legend>
      {previewUrl && (
        <img
          src={previewUrl}
          alt="The meter, as it will be saved"
          className="max-h-48 self-start rounded-sm border border-gray-300"
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
          <Button variant="secondary" isDisabled={isBusy} onClick={onRemove}>
            Remove photo
          </Button>
        )}
      </div>
      {isShrinking && <p role="status">Shrinking the photo…</p>}
      {errorMessage && (
        <p id={ERROR_ID} role="alert" className="text-red-700">
          {errorMessage}
        </p>
      )}
    </fieldset>
  );
}

export default PhotoPicker;
