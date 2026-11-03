import { strToU8, zipSync, type Zippable } from 'fflate';
import type { BackupReadingApiModel, ReadingsBackupApiModel } from '@app-types/models';

// The folders the API's zip holds (api/src/modules/readings/readings.backup.ts), there even when empty. fflate makes a
// folder, "photos/", from a key holding an object.
const PHOTOS_FOLDER = 'photos';
const BILLS_FOLDER = 'bills';

type StoredFileKind = 'photo' | 'bill';

// The demo keeps no real files, so each one is a short stand-in, under the name the JSON and CSV backups list.
function standIn(kind: StoredFileKind, reading: BackupReadingApiModel): Uint8Array {
  return strToU8(`Demo stand-in for the ${kind} of the reading of ${reading.date}`);
}

// Every Photo in photos/ and every Bill in bills/, as one zip file.
export const createReadingsBackupZipMockModel = ({ readings }: ReadingsBackupApiModel): Uint8Array => {
  const photos: Zippable = {};
  const bills: Zippable = {};

  for (const reading of readings) {
    if (reading.photoFileName) photos[reading.photoFileName] = standIn('photo', reading);

    if (reading.billFileName) bills[reading.billFileName] = standIn('bill', reading);
  }

  return zipSync({ [PHOTOS_FOLDER]: photos, [BILLS_FOLDER]: bills });
};
