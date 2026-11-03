import { useId } from 'react';
import backupService from '@services/backupService/backupService';
import { Card, CardContent, CardDescription, CardHeader } from '@components/ui/card';
import DownloadLink from './components/DownloadLink';

const TITLE = 'Data';
const DESCRIPTION = 'A copy of every reading, with its sent email and the file name of its photo.';
const JSON_LABEL = 'Export everything (JSON)';
const CSV_LABEL = 'Export everything (CSV)';

// The backup downloads: every reading, whatever Home is filtered to. There is no import.
function DataBackup() {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId}>
      <Card>
        <CardHeader>
          <h2 id={titleId} className="text-base/snug font-medium">
            {TITLE}
          </h2>
          <CardDescription>{DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <DownloadLink href={backupService.getBackupJsonUrl()} label={JSON_LABEL} />
          <DownloadLink href={backupService.getBackupCsvUrl()} label={CSV_LABEL} />
        </CardContent>
      </Card>
    </section>
  );
}

export default DataBackup;
