import { redirect, type ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import billService from '@services/billService/billService';
import { AddBillSchema } from '@services/billService/billService.type';
import readingService from '@services/readingService/readingService';
import {
  ReadingParamsSchema,
  UpdateReadingSchema,
  type UpdateReading,
} from '@services/readingService/readingService.type';
import type { ReadingApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import { parseFormData } from '@utils/formDataUtils';
import { redirectBehindReadingModal } from '@utils/readingModalUtils';
import { toastOnSuccess } from '@utils/toastUtils';
import type { UpdateCostAndBillFormData } from './types';

const COST_SAVED_MESSAGE = 'Cost saved';
const COST_REMOVED_MESSAGE = 'Cost removed';
const BILL_SAVED_MESSAGE = 'Bill saved';
const BILL_REMOVED_MESSAGE = 'Bill removed';

// The toast for a save: about the bill when it changed, as that is what the user just did; about the cost otherwise.
function toSavedMessage({ costCents, billId }: UpdateReading, isBillUploaded: boolean): string {
  if (isBillUploaded) return BILL_SAVED_MESSAGE;

  if (billId === null) return BILL_REMOVED_MESSAGE;

  if (costCents === null) return COST_REMOVED_MESSAGE;

  return COST_SAVED_MESSAGE;
}

// A new bill goes up first and the reading is updated with its id, so a refused file changes nothing and the user can
// pick another. No file, the changes go as they are.
async function saveChanges(
  readingId: number,
  changes: UpdateReading,
  bill?: File,
): Promise<JSONResponseUtil<ReadingApiModel>> {
  if (!bill) return readingService.updateReading(readingId, changes);

  const billResult = await billService.addBill(await AddBillSchema.validate(bill));

  if (!billResult.success) return { success: false, error: billResult.error };

  return readingService.updateReading(readingId, { ...changes, billId: billResult.data?.id });
}

// Saved, the dialog closes onto the page it opened over (the same page of the history, or the reading's own page),
// which shows the cost and the bill, and a toast says so. Not saved, the dialog stays open with the server's reason and the user's input.
export const updateCostAndBillAction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil | Response> => {
  const { changes, bill } = parseFormData<UpdateCostAndBillFormData>(await request.formData());

  try {
    const { readingId } = await ReadingParamsSchema.validate(params);
    const validChanges = await UpdateReadingSchema.validate(changes);

    const result = await saveChanges(readingId, validChanges, bill);

    if (!result.success) return result;

    const isBillUploaded = bill !== undefined;
    const message = toSavedMessage(validChanges, isBillUploaded);

    return toastOnSuccess(redirect(redirectBehindReadingModal(request.url, readingId)), message);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};
