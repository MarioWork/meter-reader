import { ImagePlusIcon, ImageOffIcon } from 'lucide-react';
import { useId, type ChangeEvent } from 'react';
import ErrorAlert from '@components/ErrorAlert';
import LoadingDigits from '@components/LoadingDigits';
import FileInputButton from '@components/FileInputButton';

type Props = {
  isAddingPhoto: boolean;
  isDisabled: boolean;
  failureMessage: string | undefined;
  onPhotoPicked: (event: ChangeEvent<HTMLInputElement>) => void;
};

const NO_PHOTO_LABEL = 'No photo yet';
const ADD_PHOTO_LABEL = 'Add a photo';
const ADDING_PHOTO_LABEL = 'Adding…';
// Any picture the phone or computer has; the action turns it into the app's own JPEG.
const PHOTO_ACCEPT = 'image/*';

// A reading saved without a photo: the row says so, with Add a photo, which saves the picked photo with the reading
// and brings it into this email, ready to attach, through the app's file button (FileInputButton).
function AddEmailPhoto({ isAddingPhoto, isDisabled, failureMessage, onPhotoPicked }: Props) {
  const inputId = useId();
  const isPickerDisabled = isDisabled || isAddingPhoto;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-3">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageOffIcon aria-hidden="true" className="size-4" />
          {NO_PHOTO_LABEL}
        </p>
        <FileInputButton
          id={inputId}
          accept={PHOTO_ACCEPT}
          isDisabled={isPickerDisabled}
          size="sm"
          onFileChange={onPhotoPicked}
        >
          {isAddingPhoto ? <LoadingDigits /> : <ImagePlusIcon data-icon="inline-start" aria-hidden="true" />}
          {isAddingPhoto ? ADDING_PHOTO_LABEL : ADD_PHOTO_LABEL}
        </FileInputButton>
      </div>
      {failureMessage && <ErrorAlert message={failureMessage} />}
    </div>
  );
}

export default AddEmailPhoto;
