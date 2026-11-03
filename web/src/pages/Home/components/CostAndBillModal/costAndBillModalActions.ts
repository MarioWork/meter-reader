import { redirect, type ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import readingService from '@services/readingService/readingService';
import { ReadingParamsSchema, UpdateReadingSchema } from '@services/readingService/readingService.type';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { JSONResponseUtil } from '@app-types/utility';
import { parseFormData } from '@utils/formDataUtils';
import { toastOnSuccess } from '@utils/toastUtils';
import type { UpdateCostAndBillFormData } from './types';

const COST_SAVED_MESSAGE = 'Cost saved';
const COST_REMOVED_MESSAGE = 'Cost removed';

// Saved, the dialog closes onto the same page of the history, where the card now shows the cost, and a toast says so.
// Not saved, the dialog stays open with the server's reason and the user's input.
export const updateCostAndBillAction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil | Response> => {
  const { changes } = parseFormData<UpdateCostAndBillFormData>(await request.formData());

  try {
    const { readingId } = await ReadingParamsSchema.validate(params);
    const validChanges = await UpdateReadingSchema.validate(changes);

    const result = await readingService.updateReading(readingId, validChanges);

    if (!result.success) return result;

    const isCostRemoved = validChanges.costCents === null;
    const message = isCostRemoved ? COST_REMOVED_MESSAGE : COST_SAVED_MESSAGE;

    return toastOnSuccess(redirect(`${BASE_ROUTES_PATHS.HOME}${new URL(request.url).search}`), message);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};
