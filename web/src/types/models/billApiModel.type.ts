import type { BillContentType } from './billContentType.type';

// The provider's bill for one reading (docs/GLOSSARY.md: Bill), kept by the API once uploaded. Updating a reading
// with its id links the two. `name` is what the app shows: the name the file had on the user's device, or one the
// API gave it ("bill-2026-10-31.pdf"). `sizeBytes` is the file's size.
export interface BillApiModel {
  id: number;
  name: string;
  contentType: BillContentType;
  sizeBytes: number;
  createdAt: string;
}

export type BillId = BillApiModel['id'];
