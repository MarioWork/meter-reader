import { Button } from '@components/ui/button';
import { Empty, EmptyContent } from '@components/ui/empty';
import NoMatchingReadingsHeader from './components/NoMatchingReadingsHeader';

type Props = {
  onClearFilters: () => void;
};

const CLEAR_LABEL = 'Clear filters';

// A filtered history with nothing in it, and the way back to the whole history.
function NoMatchingReadings({ onClearFilters }: Props) {
  return (
    <Empty className="border bg-card">
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
