import type { BillContentType } from './billContentType.type';

// The provider's bill for one reading (docs/GLOSSARY.md: Bill), kept by the API once uploaded. Updating a reading
// with its id links the two. `sizeBytes` is the file's size.
export interface BillApiModel {
  id: number;
  contentType: BillContentType;
  sizeBytes: number;
  createdAt: string;
}

export type BillId = BillApiModel['id'];
