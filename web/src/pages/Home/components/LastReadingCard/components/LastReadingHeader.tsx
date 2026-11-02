import type { ReadingApiModel } from '@app-types/models';
import { CardAction, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { formatIsoDate } from '@utils/dateUtils';
import ReadingActionsMenu from '../../ReadingActionsMenu';

type Props = {
  reading: ReadingApiModel;
  titleId: string;
};

const TITLE = 'Last reading';

// "Last reading", the day it was read, and its "⋯" menu.
function LastReadingHeader({ reading, titleId }: Props) {
  return (
    <CardHeader>
      <CardTitle>
        <h2 id={titleId}>{TITLE}</h2>
      </CardTitle>
      <CardDescription>{formatIsoDate(reading.date)}</CardDescription>
      <CardAction>
        <ReadingActionsMenu reading={reading} />
      </CardAction>
    </CardHeader>
  );
}

export default LastReadingHeader;
