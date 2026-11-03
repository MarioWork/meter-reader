import ErrorAlert from '@components/ErrorAlert';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';

type Props = {
  formError?: string;
  isSaving: boolean;
};

const SAVE_LABEL = 'Save';

// Why the last save failed, if it did, and Save at the end of the row. One block, so it takes one grid row on a wide
// screen whether the error shows or not.
function SaveRow({ formError, isSaving }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {formError && <ErrorAlert message={formError} />}
      <Button type="submit" size="lg" disabled={isSaving} className="self-end">
        {isSaving && <Spinner aria-hidden="true" />}
        {SAVE_LABEL}
      </Button>
    </div>
  );
}

export default SaveRow;
