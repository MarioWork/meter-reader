import { DownloadIcon } from 'lucide-react';
import readingService from '@services/readingService/readingService';
import { buttonVariants } from '@components/ui/button';
import type { DayRange } from '@components/HistoryFilters/types';

type Props = {
  range: DayRange;
};

const EXPORT_LABEL = 'Export';
// Starts with the visible word, so a voice command naming what is on screen still finds it.
const EXPORT_ACCESSIBLE_NAME = 'Export costs as a spreadsheet';

// Downloads the readings the Costs page lists as an .xlsx file, for the same day range, with their sum. A link, as the
// browser fetches a file; the API names it and sends it as a download, so the page stays where it is.
function ExportCostsLink({ range }: Props) {
  const href = readingService.getCostsSpreadsheetUrl(range);

  return (
    <a href={href} download aria-label={EXPORT_ACCESSIBLE_NAME} className={buttonVariants({ variant: 'outline' })}>
      <DownloadIcon data-icon="inline-start" aria-hidden />
      {EXPORT_LABEL}
    </a>
  );
}

export default ExportCostsLink;
