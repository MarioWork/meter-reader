import { useId } from 'react';
import ErrorAlert from '@components/ErrorAlert';
import { Button } from '@components/ui/button';
import { CardFooter } from '@components/ui/card';
import LoadingDigits from '@components/LoadingDigits';

type Props = {
  formError?: string;
  isSaving: boolean;
};

const SAVE_LABEL = 'Save';
const SAVE_HINT = 'Saves the addresses and the message together.';

// The Email card's footer: why the last save failed, if it did, on a line of its own, then what Save covers and Save
// itself, at the end of everything it saves.
function SaveBar({ formError, isSaving }: Props) {
  const hintId = useId();

  return (
    <CardFooter className="flex-wrap justify-between gap-3">
      {formError && (
        <div className="basis-full">
          <ErrorAlert message={formError} />
        </div>
      )}
      <p id={hintId} className="text-muted-foreground">
        {SAVE_HINT}
      </p>
      <Button type="submit" size="lg" disabled={isSaving} aria-describedby={hintId} className="ml-auto">
        {isSaving && <LoadingDigits />}
        {SAVE_LABEL}
      </Button>
    </CardFooter>
  );
}

export default SaveBar;
