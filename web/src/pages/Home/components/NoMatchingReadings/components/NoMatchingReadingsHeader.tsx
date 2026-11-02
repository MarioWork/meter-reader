import { SearchXIcon } from 'lucide-react';
import { EmptyHeader, EmptyMedia, EmptyTitle } from '@components/ui/empty';

const TITLE = 'No readings match these filters';

// The empty result's icon and heading.
function NoMatchingReadingsHeader() {
  return (
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <SearchXIcon />
      </EmptyMedia>
      <EmptyTitle>
        <h2>{TITLE}</h2>
      </EmptyTitle>
    </EmptyHeader>
  );
}

export default NoMatchingReadingsHeader;
