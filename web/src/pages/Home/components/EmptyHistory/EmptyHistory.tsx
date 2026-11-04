import { GaugeIcon } from 'lucide-react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@components/ui/empty';
import { useIsWideScreen } from '@hooks/useIsWideScreen';

const TITLE = 'No readings yet';
const PHONE_DESCRIPTION = 'Tap New reading below, take a photo of your meter, and your first reading shows up here.';
const WIDE_DESCRIPTION = 'Press New reading above, add a photo of your meter, and your first reading shows up here.';

// The history before the first reading. It points at New reading: at the bottom on a phone, at the top on a wide
// screen, where it sits inside the list's tile and so needs no card of its own.
function EmptyHistory() {
  const isWideScreen = useIsWideScreen();
  const description = isWideScreen ? WIDE_DESCRIPTION : PHONE_DESCRIPTION;

  return (
    <Empty className="border bg-card sm:border-0 sm:bg-transparent">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <GaugeIcon />
        </EmptyMedia>
        <EmptyTitle>
          <h2>{TITLE}</h2>
        </EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default EmptyHistory;
