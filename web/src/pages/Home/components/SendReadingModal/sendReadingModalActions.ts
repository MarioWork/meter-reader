import { redirect, type ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import readingService from '@services/readingService/readingService';
import { ReadingParamsSchema, SendReadingSchema, type SendReading } from '@services/readingService/readingService.type';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { JSONResponseUtil } from '@app-types/utility';
import { parseFormData } from '@utils/formDataUtils';
import { toastActionResult } from '@utils/toastUtils';

const SEND_TOAST_MESSAGES = { success: 'Reading sent', failure: 'Reading not sent' };

async function sendReading({ request, params }: ActionFunctionArgs): Promise<JSONResponseUtil | Response> {
  const fields = parseFormData<SendReading>(await request.formData());

  try {
    const { readingId } = await ReadingParamsSchema.validate(params);
    const validFields = await SendReadingSchema.validate(fields);

    const result = await readingService.sendReading(readingId, validFields);

    if (!result.success) return result;

    return redirect(`${BASE_ROUTES_PATHS.HOME}${new URL(request.url).search}`);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
}

// Sent, the preview closes onto the same page of the history, where the reading now shows as sent. Not sent, the
// preview stays open with the server's reason; the API has marked the reading failed, and the history behind says so.
// Either way a toast says how it went.
export const sendReadingAction = async (args: ActionFunctionArgs): Promise<JSONResponseUtil | Response> =>
  toastActionResult(await sendReading(args), SEND_TOAST_MESSAGES);
