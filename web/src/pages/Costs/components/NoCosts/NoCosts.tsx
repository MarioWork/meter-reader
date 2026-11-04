import { FunnelXIcon, ReceiptEuroIcon, SearchXIcon, type LucideIcon } from 'lucide-react';
import EmptyMeter from '@components/EmptyMeter';
import { Button } from '@components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@components/ui/empty';

type Props = {
  isFiltered: boolean;
  onClearFilters: () => void;
};

type EmptyState = {
  // The badge on the blank meter: what the empty page is about.
  BadgeIcon: LucideIcon;
  title: string;
  description: string;
};

type EmptyStateKind = 'filtered' | 'unfiltered';

const CLEAR_LABEL = 'Clear filters';

const EMPTY_STATES: Record<EmptyStateKind, EmptyState> = {
  filtered: {
    BadgeIcon: SearchXIcon,
    title: 'No readings in these dates',
    description: 'Pick other dates, or clear the filters to see every reading.',
  },
  unfiltered: {
    BadgeIcon: ReceiptEuroIcon,
    title: 'No readings yet',
    description: 'Save a reading on Home, then add its cost or bill from its ⋯ menu, and it shows up here.',
  },
};

// Nothing to list: no reading yet, or none in the dates picked, as a blank meter like the other
// empty pages, with a receipt or a search on it. The second comes with the way back to every reading.
function NoCosts({ isFiltered, onClearFilters }: Props) {
  const { BadgeIcon, title, description } = EMPTY_STATES[isFiltered ? 'filtered' : 'unfiltered'];

  return (
    <Empty className="border bg-card">
      <EmptyHeader>
        <EmptyMedia className="mb-4">
          <EmptyMeter BadgeIcon={BadgeIcon} />
        </EmptyMedia>
        <EmptyTitle>
          <h2>{title}</h2>
        </EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {isFiltered && (
        <EmptyContent>
          <Button variant="outline" onClick={onClearFilters}>
            <FunnelXIcon data-icon="inline-start" aria-hidden="true" />
            {CLEAR_LABEL}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

export default NoCosts;
