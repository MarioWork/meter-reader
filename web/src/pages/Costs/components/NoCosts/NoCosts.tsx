import { ReceiptEuroIcon, SearchXIcon } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@components/ui/empty';

type Props = {
  isFiltered: boolean;
  onClearFilters: () => void;
};

type EmptyState = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

type EmptyStateKind = 'filtered' | 'unfiltered';

const CLEAR_LABEL = 'Clear filters';

const EMPTY_STATES: Record<EmptyStateKind, EmptyState> = {
  filtered: {
    icon: <SearchXIcon />,
    title: 'No costs in these dates',
    description: 'None of the readings in these dates has a cost or a bill.',
  },
  unfiltered: {
    icon: <ReceiptEuroIcon />,
    title: 'No costs yet',
    description: 'Add a cost or a bill to a reading from its ⋯ menu on Home, and it shows up here.',
  },
};

// Nothing to list: no reading has a cost or a bill yet, or none in the dates picked. The second comes with the way
// back to every reading.
function NoCosts({ isFiltered, onClearFilters }: Props) {
  const { icon, title, description } = EMPTY_STATES[isFiltered ? 'filtered' : 'unfiltered'];

  return (
    <Empty className="border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>
          <h2>{title}</h2>
        </EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {isFiltered && (
        <EmptyContent>
          <Button variant="outline" onClick={onClearFilters}>
            {CLEAR_LABEL}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

export default NoCosts;
