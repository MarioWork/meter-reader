import { useId } from 'react';
import type { ReadingApiModel } from '@app-types/models';
import { Card } from '@components/ui/card';
import ReadingSummary from '../ReadingSummary';
import SendReadingFooter from '../SendReadingFooter';
import LastReadingHeader from './components/LastReadingHeader';

type Props = {
  reading: ReadingApiModel;
  // Focused after a send or a delete here took focus away (useHistoryFocus).
  ref: React.Ref<HTMLElement>;
};

// The newest reading, big: the number the meter showed, the day, whether it went out, and Send or Try again as the
// page's main action while it can still go.
function LastReadingCard({ reading, ref }: Props) {
  const titleId = useId();

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby={titleId}
      className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Card>
        <LastReadingHeader reading={reading} titleId={titleId} />
        <ReadingSummary reading={reading} isProminent />
        <SendReadingFooter reading={reading} isProminent />
      </Card>
    </section>
  );
}

export default LastReadingCard;
