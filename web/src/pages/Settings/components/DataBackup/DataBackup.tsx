import { useId } from 'react';
import readingService from '@services/readingService/readingService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import DownloadLink from '@components/DownloadLink';

const TITLE = 'Data';
const DESCRIPTION =
  'A copy of every reading, with its sent email, its cost and the file names of its photo and bill. ' +
  'The zip holds those photos and bills under the same names.';
const JSON_LABEL = 'Export everything (JSON)';
const CSV_LABEL = 'Export everything (CSV)';
const ZIP_LABEL = 'Export files (zip)';

// The backup downloads: every reading, whatever Home is filtered to. There is no import.
function DataBackup() {
  const titleId = useId();

  // Card is a div, so the role makes it the page's named Data section.
  return (
    <Card role="region" aria-labelledby={titleId}>
      <CardHeader>
        <CardTitle>
          <h2 id={titleId}>{TITLE}</h2>
        </CardTitle>
        <CardDescription>{DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <DownloadLink href={readingService.getReadingsBackupJsonUrl()} label={JSON_LABEL} />
        <DownloadLink href={readingService.getReadingsBackupCsvUrl()} label={CSV_LABEL} />
        <DownloadLink href={readingService.getReadingsBackupZipUrl()} label={ZIP_LABEL} />
      </CardContent>
    </Card>
  );
}

export default DataBackup;
