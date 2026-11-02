type Props = {
  id: string;
  label: string;
  // Opens the back camera on a phone; elsewhere it is an ordinary file picker.
  isCamera?: boolean;
  isDisabled: boolean;
  describedById?: string;
  onPick: (photo: File) => void;
};

// Any photo the device has, in any image format; the app turns it into a JPEG itself.
const ACCEPTED_FILES = 'image/*';
const BACK_CAMERA = 'environment';

const LABEL_CLASSES = `
  min-h-6 cursor-pointer rounded-sm border border-primary bg-background px-3 py-1 text-primary
  has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring
  has-disabled:cursor-not-allowed has-disabled:opacity-60
`;

// A native file input behind a button-like label: the label is its name, and keyboard focus shows on the label.
function PhotoInput({ id, label, isCamera = false, isDisabled, describedById, onPick }: Props) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const photo = event.target.files?.[0];

    // Cleared, so picking the same file again still counts as a change.
    event.target.value = '';

    if (photo) onPick(photo);
  }

  return (
    <label htmlFor={id} className={LABEL_CLASSES}>
      {label}
      <input
        id={id}
        type="file"
        accept={ACCEPTED_FILES}
        capture={isCamera ? BACK_CAMERA : undefined}
        disabled={isDisabled}
        aria-invalid={describedById !== undefined}
        aria-describedby={describedById}
        onChange={handleChange}
        className="sr-only"
      />
    </label>
  );
}

export default PhotoInput;
