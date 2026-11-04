import { SearchXIcon } from 'lucide-react';
import EmptyMeter from '@components/EmptyMeter';
import { EmptyHeader, EmptyMedia, EmptyTitle } from '@components/ui/empty';

const TITLE = 'No readings match these filters';

// The empty result's picture, a blank meter with a search that found nothing, and its heading.
function NoMatchingReadingsHeader() {
  return (
    <EmptyHeader>
      <EmptyMedia className="mb-4">
        <EmptyMeter BadgeIcon={SearchXIcon} />
      </EmptyMedia>
      <EmptyTitle>
        <h2>{TITLE}</h2>
      </EmptyTitle>
    </EmptyHeader>
  );
}

export default NoMatchingReadingsHeader;
