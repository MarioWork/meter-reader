import { ChartColumnIcon } from 'lucide-react';
import type { DayRange } from '@components/HistoryFilters/types';
import PageHeader from '@components/PageHeader';
import ExportCostsLink from '../ExportCostsLink';

type Props = {
  range: DayRange;
  hasListedReadings: boolean;
};

const PAGE_TITLE = 'Water Readings Costs';

// Costs' title with Export on its right, only while readings are listed: an empty page has nothing to export.
function CostsHeader({ range, hasListedReadings }: Props) {
  return (
    <PageHeader
      title={PAGE_TITLE}
      Icon={ChartColumnIcon}
      actions={hasListedReadings && <ExportCostsLink range={range} />}
    />
  );
}

export default CostsHeader;
