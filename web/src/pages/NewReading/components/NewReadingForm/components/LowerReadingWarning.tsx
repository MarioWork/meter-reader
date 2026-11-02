import { TriangleAlertIcon } from 'lucide-react';
import type { ReadingApiModel } from '@app-types/models';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { formatIsoDate } from '@utils/dateUtils';

type Props = {
  id: string;
  lastReading: ReadingApiModel;
};

// A warning, not an error: the reading can still be saved. role="status" reads it out politely as it appears,
// where the Alert's own role="alert" would interrupt the typing.
function LowerReadingWarning({ id, lastReading }: Props) {
  return (
    <Alert id={id} variant="warning" role="status">
      <TriangleAlertIcon aria-hidden />
      <AlertTitle>Check the digits</AlertTitle>
      <AlertDescription>
        This is lower than your last reading ({lastReading.digits} on {formatIsoDate(lastReading.date)}). A meter only
        counts up. You can still save it.
      </AlertDescription>
    </Alert>
  );
}

export default LowerReadingWarning;
