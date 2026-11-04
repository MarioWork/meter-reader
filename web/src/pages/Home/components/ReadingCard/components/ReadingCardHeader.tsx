import type { ReadingApiModel } from '@app-types/models';
import { CardAction, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { formatIsoDate } from '@utils/dateUtils';
import ReadingActionsMenu from '../../ReadingActionsMenu';
import ReadingSendStatus from '@components/ReadingSendStatus';

type Props = {
  reading: ReadingApiModel;
};

// The day as the card's heading, the send status under it, and the "⋯" menu on the right.
function ReadingCardHeader({ reading }: Props) {
  return (
    <CardHeader>
      <CardTitle>
        <h3>{formatIsoDate(reading.date)}</h3>
      </CardTitle>
      <CardDescription>
        <ReadingSendStatus reading={reading} />
      </CardDescription>
      <CardAction className="relative z-10">
        <ReadingActionsMenu reading={reading} />
      </CardAction>
    </CardHeader>
  );
}

export default ReadingCardHeader;
