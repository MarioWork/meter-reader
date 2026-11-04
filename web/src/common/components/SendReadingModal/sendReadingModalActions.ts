import { redirect, type ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import readingService from '@services/readingService/readingService';
import { ReadingParamsSchema, SendReadingSchema, type SendReading } from '@services/readingService/readingService.type';
import type { JSONResponseUtil } from '@app-types/utility';
import { parseFormData } from '@utils/formDataUtils';
import { redirectBehindReadingModal } from '@utils/readingModalUtils';
import { toastOnSuccess } from '@utils/toastUtils';

const SENT_MESSAGE = 'Reading sent';

async function sendReading({ request, params }: ActionFunctionArgs): Promise<JSONResponseUtil | Response> {
  const fields = parseFormData<SendReading>(await request.formData());

  try {
    const { readingId } = await ReadingParamsSchema.validate(params);
    const validFields = await SendReadingSchema.validate(fields);

    const result = await readingService.sendReading(readingId, validFields);

    if (!result.success) return result;

    return redirect(redirectBehindReadingModal(request.url, readingId));
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
}

// Sent, the preview closes onto the page it opened over (the same page of the history, or the reading's own page),
// where the reading now shows as sent. Not sent, the preview stays open with the server's reason; the API has marked
// the reading failed, and the page behind says so.
// A toast confirms a send.
export const sendReadingAction = async (args: ActionFunctionArgs): Promise<JSONResponseUtil | Response> =>
  toastOnSuccess(await sendReading(args), SENT_MESSAGE);
