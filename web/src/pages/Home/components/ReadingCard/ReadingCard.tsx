import type { ReadingApiModel } from '@app-types/models';
import { Card } from '@components/ui/card';
import ReadingCardHeader from './components/ReadingCardHeader';
import ReadingDetailsLink from './components/ReadingDetailsLink';
import ReadingSummary from './components/ReadingSummary';

type Props = {
  reading: ReadingApiModel;
  // The newest reading's digits are bigger; everything else is laid out the same on every card.
  isProminent?: boolean;
};

// One reading, laid out the same everywhere in the history: its day, whether it went out and the "⋯" menu on top;
// the digits below, with Send or Try again as an icon beside them. A tap anywhere else opens its details.
function ReadingCard({ reading, isProminent = false }: Props) {
  return (
    <Card size={isProminent ? 'default' : 'sm'} className="relative transition-colors hover:bg-muted/40">
      <ReadingDetailsLink reading={reading} />
      <ReadingCardHeader reading={reading} />
      <ReadingSummary reading={reading} isProminent={isProminent} />
    </Card>
  );
}

export default ReadingCard;
