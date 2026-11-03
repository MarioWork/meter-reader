// Long enough for a phone's browser to finish reading the file after the click; the download holds its own copy then.
const OBJECT_URL_LIFETIME_MS = 60_000;

// Saves a file the app already holds, under the given name, as a download link would: a temporary object URL on a
// temporary link. Nothing is fetched again.
export function downloadFile(file: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(file);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = fileName;
  link.click();

  setTimeout(() => URL.revokeObjectURL(objectUrl), OBJECT_URL_LIFETIME_MS);
}
