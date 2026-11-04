import readingService from '@services/readingService/readingService';
import IconDownloadLink from '@components/IconDownloadLink';
import type { DayRange } from '@components/HistoryFilters/types';

type Props = {
  range: DayRange;
};

const EXPORT_LABEL = 'Export as spreadsheet';

// Downloads the readings the Costs page lists as an .xlsx file, for the same day range, with their sum. A link, as the
// browser fetches a file; the API names it and sends it as a download, so the page stays where it is.
function ExportCostsLink({ range }: Props) {
  const href = readingService.getCostsSpreadsheetUrl(range);

  return <IconDownloadLink href={href} label={EXPORT_LABEL} />;
}

export default ExportCostsLink;
