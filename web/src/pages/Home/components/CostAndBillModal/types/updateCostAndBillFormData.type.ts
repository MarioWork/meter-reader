import type { UpdateReading } from '@services/readingService/readingService.type';

// What the dialog submits to its action. The changes travel as one JSON value: a cost cleared is `null`, which a plain
// form field cannot carry. `bill` is a new file the user picked: the action uploads it first, and its id becomes the
// changes' `billId`.
export type UpdateCostAndBillFormData = { changes: UpdateReading; bill: File | undefined };
