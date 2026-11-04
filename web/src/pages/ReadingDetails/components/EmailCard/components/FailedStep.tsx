import { CircleXIcon } from 'lucide-react';
import TimelineStep from './TimelineStep';
import { useReading } from '../../../hooks/useReading';

const FAILED_LABEL = 'Failed';
// A reading that failed before the API kept why, or failed on a server bug, has no reason of its own.
const UNKNOWN_FAILURE_REASON = 'The email did not go out.';

// When the send failed, and the reason the user was told then.
function FailedStep() {
  const reading = useReading();
  return (
    <TimelineStep Icon={CircleXIcon} tone="error" label={FAILED_LABEL} timestamp={reading.failedAt}>
      <p>{reading.failureReason ?? UNKNOWN_FAILURE_REASON}</p>
    </TimelineStep>
  );
}

export default FailedStep;
