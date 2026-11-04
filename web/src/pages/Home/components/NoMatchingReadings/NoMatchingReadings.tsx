import { Button } from '@components/ui/button';
import { Empty, EmptyContent } from '@components/ui/empty';
import NoMatchingReadingsHeader from './components/NoMatchingReadingsHeader';

type Props = {
  onClearFilters: () => void;
};

const CLEAR_LABEL = 'Clear filters';

// A filtered history with nothing in it, and the way back to the whole history. A wide screen shows it inside the
// list's tile, so it needs no card of its own there.
function NoMatchingReadings({ onClearFilters }: Props) {
  return (
    <Empty className="border bg-card sm:border-0 sm:bg-transparent">
      <NoMatchingReadingsHeader />
      <EmptyContent>
        <Button variant="outline" onClick={onClearFilters}>
          {CLEAR_LABEL}
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export default NoMatchingReadings;
