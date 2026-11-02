import type { ReadingApiModel } from '@app-types/models';
import { Card, CardAction, CardHeader, CardTitle } from '@components/ui/card';
import { formatIsoDate } from '@utils/dateUtils';
import ReadingActionsMenu from '../../ReadingActionsMenu';
import ReadingSummary from '../../ReadingSummary';
import SendReadingFooter from '../../SendReadingFooter';

type Props = {
  reading: ReadingApiModel;
};

// One reading of the history: its day as the card's heading, the digits, whether it was sent, Send or Try again
// while it can still go out, and the "⋯" menu.
function ReadingHistoryCard({ reading }: Props) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          <h3>{formatIsoDate(reading.date)}</h3>
        </CardTitle>
        <CardAction>
          <ReadingActionsMenu reading={reading} />
        </CardAction>
      </CardHeader>
      <ReadingSummary reading={reading} />
      <SendReadingFooter reading={reading} />
    </Card>
  );
}

export default ReadingHistoryCard;
