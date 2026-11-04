import { ChartColumnIcon } from 'lucide-react';
import type { DayRange } from '@components/HistoryFilters/types';
import PageHeader from '@components/PageHeader';
import ExportCostsLink from '../ExportCostsLink';

type Props = {
  range: DayRange;
  hasListedReadings: boolean;
  // The phone's Filter button, before Export; null on a wide screen.
  filterButton: React.ReactNode;
};

const PAGE_TITLE = 'Water Readings Costs';

// Costs' title with Export on its right, only while readings are listed: an empty page has nothing to export. A
// phone's Filter comes before it.
function CostsHeader({ range, hasListedReadings, filterButton }: Props) {
  return (
    <PageHeader
      title={PAGE_TITLE}
      Icon={ChartColumnIcon}
      actions={
        <>
          {filterButton}
          {hasListedReadings && <ExportCostsLink range={range} />}
        </>
      }
    />
  );
}

export default CostsHeader;
