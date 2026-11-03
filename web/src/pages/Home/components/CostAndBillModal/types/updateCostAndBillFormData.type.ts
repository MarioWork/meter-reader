import type { UpdateReading } from '@services/readingService/readingService.type';

// What the dialog submits to its action. The changes travel as one JSON value: a cost cleared is `null`, which a plain
// form field cannot carry.
export type UpdateCostAndBillFormData = { changes: UpdateReading };
