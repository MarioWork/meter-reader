import { DownloadIcon } from 'lucide-react';
import readingService from '@services/readingService/readingService';
import { buttonVariants } from '@components/ui/button';
import type { HistoryFilterValues } from '../../types';

type Props = {
  filters: HistoryFilterValues;
};

const EXPORT_LABEL = 'Export';
// Starts with the visible word, so a voice command naming what is on screen still finds it.
const EXPORT_ACCESSIBLE_NAME = 'Export readings as a spreadsheet';

// Downloads the history as an .xlsx file: every reading Home's filters match, not only the pages loaded. A link, as
// the browser fetches a file; the API names it and sends it as a download, so the page stays where it is.
function ExportReadingsLink({ filters }: Props) {
  // Where the user is, as an IANA name ("Europe/Lisbon"), so the sent times read as their own clock showed them.
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const href = readingService.getReadingsSpreadsheetUrl({ ...filters, timeZone });

  return (
    <a href={href} download aria-label={EXPORT_ACCESSIBLE_NAME} className={buttonVariants({ variant: 'outline' })}>
      <DownloadIcon data-icon="inline-start" aria-hidden />
      {EXPORT_LABEL}
    </a>
  );
}

export default ExportReadingsLink;
