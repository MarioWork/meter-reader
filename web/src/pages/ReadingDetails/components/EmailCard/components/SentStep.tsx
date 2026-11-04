import { CircleCheckIcon } from 'lucide-react';
import TimelineStep from './TimelineStep';
import { useReading } from '../../../hooks/useReading';

const SENT_LABEL = 'Sent';

// When the mail service accepted the email.
function SentStep() {
  const reading = useReading();
  return <TimelineStep Icon={CircleCheckIcon} tone="success" label={SENT_LABEL} timestamp={reading.sentAt} />;
}

export default SentStep;
