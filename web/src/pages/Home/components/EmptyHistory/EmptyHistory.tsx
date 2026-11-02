import { GaugeIcon } from 'lucide-react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@components/ui/empty';

const TITLE = 'No readings yet';
const DESCRIPTION = 'Tap New reading below, take a photo of your meter, and your first reading shows up here.';

// The history before the first reading. It points at the New reading button that is always at the bottom.
function EmptyHistory() {
  return (
    <Empty className="border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <GaugeIcon />
        </EmptyMedia>
        <EmptyTitle>
          <h2>{TITLE}</h2>
        </EmptyTitle>
        <EmptyDescription>{DESCRIPTION}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default EmptyHistory;
