import { HouseIcon } from 'lucide-react';
import type { HistoryFilterValues } from '@components/HistoryFilters/types';
import PageHeader from '@components/PageHeader';
import { useIsWideScreen } from '@hooks/useIsWideScreen';
import ExportReadingsLink from '../ExportReadingsLink';
import NewReadingLink from '../NewReadingLink';

type Props = {
  filters: HistoryFilterValues;
  isFiltered: boolean;
  hasReadings: boolean;
  totalResultNumber: number;
  // The phone's Filter button, first among the actions; null on a wide screen.
  filterButton: React.ReactNode;
};

const PAGE_TITLE = 'Water Readings';
const MATCHING_SUFFIX = 'matching';
const WHOLE_HISTORY_SUFFIX = 'in your history';

function readingCountText(totalResultNumber: number, isFiltered: boolean) {
  const suffix = isFiltered ? MATCHING_SUFFIX : WHOLE_HISTORY_SUFFIX;

  return `${totalResultNumber} ${suffix}`;
}

// Home's title, with the reading count under it on a wide screen. Export only while readings are shown: an empty
// history, or a filter matching none, has nothing to export. A phone's Filter comes before it. A wide screen has New reading after it; a phone keeps
// New reading at the bottom (NewReadingBar).
function HomeHeader({ filters, isFiltered, hasReadings, totalResultNumber, filterButton }: Props) {
  const isWideScreen = useIsWideScreen();

  return (
    <PageHeader
      title={PAGE_TITLE}
      Icon={HouseIcon}
      description={readingCountText(totalResultNumber, isFiltered)}
      actions={
        <>
          {filterButton}
          {hasReadings && <ExportReadingsLink filters={filters} />}
          {isWideScreen && <NewReadingLink />}
        </>
      }
    />
  );
}

export default HomeHeader;
