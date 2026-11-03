// What kind of file a bill is, as the API sends it: it reads the type from the file's own bytes.
export type BillContentType = 'application/pdf' | 'image/jpeg' | 'image/png';
