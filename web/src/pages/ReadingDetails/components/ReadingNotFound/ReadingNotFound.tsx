import { SearchXIcon } from 'lucide-react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@components/ui/empty';

const TITLE = 'This reading is not here';
const DESCRIPTION = 'It may have been deleted, or the link is old or mistyped. Your other readings are still there.';

// No reading by this id: the page's one heading says so, and "← Readings" above it is the way back.
function ReadingNotFound() {
  return (
    <Empty className="border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
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
