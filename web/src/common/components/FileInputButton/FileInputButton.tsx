import type { ChangeEvent, ReactNode } from 'react';
import { buttonVariants } from '@components/ui/button';
import { cn } from '@utils/classNameUtils';

type Props = {
  id: string;
  accept: string;
  isDisabled: boolean;
  hasError?: boolean;
  // The hint and the error under the field, by id.
  describedBy?: string;
  size?: 'default' | 'sm';
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  // The button's icon and word.
  children: ReactNode;
};

// The browser's own file input ("Choose file / No file chosen"), restyled as the app's outline button: the input stays
// in the page for the keyboard, screen readers and tests, visually hidden, and its label is drawn as the button, ringed
// while the input has keyboard focus, dimmed while it is off, red-edged while it is invalid. The two come as siblings,
// so the label can read the input's state (Tailwind's `peer`).
function FileInputButton({
  id,
  accept,
  isDisabled,
  hasError = false,
  describedBy,
  size = 'default',
  onFileChange,
  children,
}: Props) {
  return (
    <>
      <input
        id={id}
        type="file"
        accept={accept}
        disabled={isDisabled}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        onChange={onFileChange}
        className="peer sr-only"
      />
      <label
        htmlFor={id}
        className={cn(
          buttonVariants({ variant: 'outline', size }),
          'cursor-pointer peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-disabled:pointer-events-none peer-disabled:opacity-50 peer-aria-invalid:border-destructive',
        )}
      >
        {children}
      </label>
    </>
  );
}

export default FileInputButton;
