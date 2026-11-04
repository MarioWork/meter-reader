import { CircleDotIcon } from 'lucide-react';
import { ReadingStatusUtil } from '@app-types/utility';
import FailedStep from './FailedStep';
import NotSentStep from './NotSentStep';
import SentStep from './SentStep';
import TimelineStep from './TimelineStep';
import { useReading } from '../../../hooks/useReading';

const SAVED_LABEL = 'Saved';

// What happened after the save, by the reading's status.
const LAST_STEPS: Record<ReadingStatusUtil, () => React.ReactNode> = {
  [ReadingStatusUtil.SENT]: SentStep,
  [ReadingStatusUtil.FAILED]: FailedStep,
  [ReadingStatusUtil.NOT_SENT]: NotSentStep,
};

// The email's short story, oldest first: saved, then sent, failed with its reason, or not sent yet.
function SendTimeline() {
  const reading = useReading();
  const LastStep = LAST_STEPS[reading.status];

  return (
    <ol className="flex flex-col gap-3">
      <TimelineStep Icon={CircleDotIcon} tone="muted" label={SAVED_LABEL} timestamp={reading.createdAt} />
      <LastStep />
    </ol>
  );
}

export default SendTimeline;
