import { CircleDashedIcon } from 'lucide-react';
import TimelineStep from './TimelineStep';

const NOT_SENT_LABEL = 'Not sent yet';

// Says the email has not gone out. Send follows under the timeline (EmailCard).
function NotSentStep() {
  return <TimelineStep Icon={CircleDashedIcon} tone="muted" label={NOT_SENT_LABEL} timestamp={null} />;
}

export default NotSentStep;
