import readingService from '@services/readingService/readingService';
import SettingsCard from '../SettingsCard';
import DownloadLink from './components/DownloadLink';

const TITLE = 'Data';
const DESCRIPTION =
  'A copy of every reading, with its sent email, its cost and the file names of its photo and bill. ' +
  'The zip holds those photos and bills under the same names.';
const JSON_LABEL = 'Export everything (JSON)';
const CSV_LABEL = 'Export everything (CSV)';
const ZIP_LABEL = 'Export files (zip)';

// The backup downloads: every reading, whatever Home is filtered to. There is no import.
function DataBackup() {
  return (
    <SettingsCard title={TITLE} description={DESCRIPTION}>
      <div className="flex flex-wrap gap-2">
        <DownloadLink href={readingService.getReadingsBackupJsonUrl()} label={JSON_LABEL} />
        <DownloadLink href={readingService.getReadingsBackupCsvUrl()} label={CSV_LABEL} />
        <DownloadLink href={readingService.getReadingsBackupZipUrl()} label={ZIP_LABEL} />
      </div>
    </SettingsCard>
  );
}

export default DataBackup;
