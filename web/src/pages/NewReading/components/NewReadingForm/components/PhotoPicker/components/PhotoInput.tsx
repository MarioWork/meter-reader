import type { LucideIcon } from 'lucide-react';
import { buttonVariants } from '@components/ui/button';
import { cn } from '@utils/classNameUtils';

type Props = {
  id: string;
  label: string;
  icon: LucideIcon;
  // Opens the back camera on a phone; elsewhere it is an ordinary file picker.
  isCamera?: boolean;
  // The big area at the top of the page, before any photo is picked.
  isLarge?: boolean;
  isDisabled: boolean;
  describedById?: string;
  onPick: (photo: File) => void;
};

// Any photo the device has, in any image format; the app turns it into a JPEG itself.
const ACCEPTED_FILES = 'image/*';
const BACK_CAMERA = 'environment';

// The label is not the focused element (the hidden input is), so the focus ring and disabled look follow the input.
const LABEL_CLASSES = `
  cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring
  has-disabled:cursor-not-allowed has-disabled:opacity-60
`;

type SizeClasses = { label: string; icon: string };

// Small, it looks like the outline Button beside it. Large, it is the big dashed area that asks for the photo.
const SIZE_CLASSES: Record<'small' | 'large', SizeClasses> = {
  small: { label: buttonVariants({ variant: 'outline', size: 'lg' }), icon: 'size-4' },
  large: {
    label: `
      flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed
      border-primary bg-primary/10 text-lg font-medium transition-colors hover:bg-primary/20
    `,
    icon: 'size-10',
  },
};

// A native file input behind a button-like label: the label is its name, and keyboard focus shows on the label.
function PhotoInput({
  id,
  label,
  icon: Icon,
  isCamera = false,
  isLarge = false,
  isDisabled,
  describedById,
  onPick,
}: Props) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const photo = event.target.files?.[0];

    // Cleared, so picking the same file again still counts as a change.
    event.target.value = '';

    if (photo) onPick(photo);
  }

  const sizeClasses = SIZE_CLASSES[isLarge ? 'large' : 'small'];

  return (
    <label htmlFor={id} className={cn(sizeClasses.label, LABEL_CLASSES)}>
      <Icon aria-hidden className={sizeClasses.icon} />
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
