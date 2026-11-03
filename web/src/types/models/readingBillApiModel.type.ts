import type { BillApiModel } from './billApiModel.type';

// The bill as a reading carries it.
export type ReadingBillApiModel = Pick<BillApiModel, 'id' | 'contentType' | 'sizeBytes'>;
