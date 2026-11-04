import { CircleQuestionMarkIcon } from 'lucide-react';
import EmptyMeter from '@components/EmptyMeter';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@components/ui/empty';

const TITLE = 'This reading is not here';
const DESCRIPTION = 'It may have been deleted, or the link is old or mistyped. Your other readings are still there.';

// No reading by this id: a blank meter with a question mark, like the other empty pages, and the page's one heading
// says so. "← Readings" above it is the way back.
function ReadingNotFound() {
  return (
    <Empty className="border bg-card">
      <EmptyHeader>
        <EmptyMedia className="mb-4">
          <EmptyMeter BadgeIcon={CircleQuestionMarkIcon} />
        </EmptyMedia>
        <EmptyTitle>
          <h1>{TITLE}</h1>
        </EmptyTitle>
        <EmptyDescription>{DESCRIPTION}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default ReadingNotFound;
