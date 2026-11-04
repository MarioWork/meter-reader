import { CircleDashedIcon } from 'lucide-react';
import ReadingSendAction from '../../ReadingSendAction';
import TimelineStep from './TimelineStep';

const NOT_SENT_LABEL = 'Not sent yet';

// Says the email has not gone out, with Send right beside it.
function NotSentStep() {
  return (
    <TimelineStep Icon={CircleDashedIcon} tone="muted" label={NOT_SENT_LABEL} timestamp={null}>
      <ReadingSendAction className="mt-1 self-start" />
    </TimelineStep>
  );
}

export default NotSentStep;
