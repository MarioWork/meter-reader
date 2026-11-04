import { useId } from 'react';
import { ReadingStatusUtil } from '@app-types/utility';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import SendTimeline from './components/SendTimeline';
import SentEmail from './components/SentEmail';
import ReadingSendAction from '../ReadingSendAction';
import { useReading } from '../../hooks/useReading';

const TITLE = 'Email';
const NOT_KEPT_MESSAGE = 'This reading was sent before the app kept a copy of its email.';

// The reading's email: when it was saved and what happened since (sent, failed with its reason, or not sent yet),
// then Send while it can still go, lined up with the card's title, and once it went out, the email exactly as it did.
function EmailCard() {
  const reading = useReading();
  const titleId = useId();
  const isSent = reading.status === ReadingStatusUtil.SENT;
  const isNotSent = reading.status === ReadingStatusUtil.NOT_SENT;

  return (
    <Card role="region" aria-labelledby={titleId}>
      <CardHeader>
        <CardTitle>
          <h2 id={titleId}>{TITLE}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SendTimeline />
        {isNotSent && <ReadingSendAction className="self-start" hasText />}
        {isSent && reading.sentEmail && <SentEmail sentEmail={reading.sentEmail} />}
        {isSent && !reading.sentEmail && <p className="text-muted-foreground">{NOT_KEPT_MESSAGE}</p>}
      </CardContent>
    </Card>
  );
}

export default EmailCard;
