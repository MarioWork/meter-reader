import type { ReadingApiModel } from '@app-types/models';
import { formatIsoDate } from '@utils/dateUtils';

type Props = {
  id: string;
  lastReading: ReadingApiModel;
};

// A warning, not an error: the reading can still be saved. role="status" reads it out politely as it appears.
function LowerReadingWarning({ id, lastReading }: Props) {
  return (
    <p id={id} role="status" className="rounded-sm border border-amber-600 bg-amber-50 px-3 py-2 text-amber-900">
      This is lower than your last reading ({lastReading.digits} on {formatIsoDate(lastReading.date)}). A meter only
      counts up, so check the digits. You can still save it.
    </p>
  );
}

export default LowerReadingWarning;
