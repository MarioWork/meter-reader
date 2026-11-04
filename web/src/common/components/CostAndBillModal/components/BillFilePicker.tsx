import type { ChangeEvent } from 'react';
import { UploadIcon } from 'lucide-react';
import FileInputButton from '@components/FileInputButton';
import { cn } from '@utils/classNameUtils';

type Props = {
  id: string;
  accept: string;
  // The file picked so far, by name; undefined until one is.
  chosenFileName: string | undefined;
  hasError: boolean;
  describedBy: string;
  isDisabled: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

const CHOOSE_LABEL = 'Choose a PDF';
const NOTHING_CHOSEN_TEXT = 'No file chosen yet';

// The bill's file picker: the app's file button (FileInputButton), a second label of the input, so its name reads
// "Bill, Choose a PDF", and the picked file's name beside it.
function BillFilePicker({ id, accept, chosenFileName, hasError, describedBy, isDisabled, onFileChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <FileInputButton
        id={id}
        accept={accept}
        isDisabled={isDisabled}
        hasError={hasError}
        describedBy={describedBy}
        onFileChange={onFileChange}
      >
        <UploadIcon data-icon="inline-start" aria-hidden="true" />
        {CHOOSE_LABEL}
      </FileInputButton>
      <span className={cn('min-w-0 truncate text-sm', !chosenFileName && 'text-muted-foreground')}>
        {chosenFileName ?? NOTHING_CHOSEN_TEXT}
      </span>
    </div>
  );
}

export default BillFilePicker;
