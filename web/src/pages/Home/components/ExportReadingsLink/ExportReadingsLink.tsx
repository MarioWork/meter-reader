import readingService from '@services/readingService/readingService';
import IconDownloadLink from '@components/IconDownloadLink';
import type { HistoryFilterValues } from '@components/HistoryFilters/types';

type Props = {
  filters: HistoryFilterValues;
};

const EXPORT_LABEL = 'Export as spreadsheet';

// Downloads the history as an .xlsx file: every reading Home's filters match, not only the pages loaded. A link, as
// the browser fetches a file; the API names it and sends it as a download, so the page stays where it is.
function ExportReadingsLink({ filters }: Props) {
  // Where the user is, as an IANA name ("Europe/Lisbon"), so the sent times read as their own clock showed them.
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const href = readingService.getReadingsSpreadsheetUrl({ ...filters, timeZone });

  return <IconDownloadLink href={href} label={EXPORT_LABEL} />;
}

export default ExportReadingsLink;
