import { useId } from 'react';
import ErrorAlert from '@components/ErrorAlert';
import { Button } from '@components/ui/button';
import { Card, CardContent } from '@components/ui/card';
import { Spinner } from '@components/ui/spinner';

type Props = {
  formError?: string;
  isSaving: boolean;
};

const SAVE_LABEL = 'Save';
const SAVE_HINT = 'Saves the email addresses and the message together.';

// The save bar under both form cards: why the last save failed, if it did, on a line of its own, then what Save
// covers and Save itself. One card, so it takes one grid row on a wide screen whether the error shows or not.
function SaveBar({ formError, isSaving }: Props) {
  const hintId = useId();

  return (
    <Card size="sm">
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        {formError && (
          <div className="basis-full">
            <ErrorAlert message={formError} />
          </div>
        )}
        <p id={hintId} className="text-muted-foreground">
          {SAVE_HINT}
        </p>
        <Button type="submit" size="lg" disabled={isSaving} aria-describedby={hintId} className="ml-auto">
          {isSaving && <Spinner aria-hidden="true" />}
          {SAVE_LABEL}
        </Button>
      </CardContent>
    </Card>
  );
}

export default SaveBar;
