import { redirect, type ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import photoService from '@services/photoService/photoService';
import { AddPhotoSchema } from '@services/photoService/photoService.type';
import readingService from '@services/readingService/readingService';
import {
  CreateReadingSchema,
  SendReadingSchema,
  type CreateReading,
} from '@services/readingService/readingService.type';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { ReadingApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import { parseFormData } from '@utils/formDataUtils';
import { toast } from '@components/ui/toast';
import { toastOnSuccess } from '@utils/toastUtils';
import { NewReadingIntent, type NewReadingEmail, type NewReadingFormData } from './newReadingUtils';

const SAVED_MESSAGE = 'Reading saved';
const SENT_MESSAGE = 'Reading saved and sent';
const NOT_SENT_MESSAGE = 'Reading saved, but not sent';
const NOT_SENT_FALLBACK = 'You can send it again from the history.';

// The photo goes up first and the reading is saved with its id, so a failed upload saves nothing and the user can
// simply try again.
async function saveReading(reading: CreateReading, photo?: File): Promise<JSONResponseUtil<ReadingApiModel>> {
  const validPhoto = photo ? await AddPhotoSchema.validate(photo) : undefined;
  const photoResult = validPhoto ? await photoService.addPhoto(validPhoto) : undefined;

  if (photoResult && !photoResult.success) return { success: false, error: photoResult.error };

  return readingService.addReading({ ...reading, photoId: photoResult?.data?.id });
}

// The reading is already saved, so the app goes Home either way: staying on the form would save it twice on a retry.
// Not sent, the API has marked it failed, the history says so, and a toast gives the server's reason.
async function sendSavedReading(reading: ReadingApiModel, email?: NewReadingEmail): Promise<Response> {
  const fields = await SendReadingSchema.validate({
    attachPhoto: reading.photoId !== null,
    // Empty means the API's own.
    subject: email?.subject || undefined,
    body: email?.body || undefined,
  });
  const result = await readingService.sendReading(reading.id, fields);

  if (result.success) {
    toast.add({ type: 'success', title: SENT_MESSAGE });
  } else {
    toast.add({ type: 'error', title: NOT_SENT_MESSAGE, description: result.error?.message ?? NOT_SENT_FALLBACK });
  }

  return redirect(BASE_ROUTES_PATHS.HOME);
}

// Saved, the app goes back to Home, where the new reading tops the history. A reading lower than the last one is
// saved too: the form only warns about it. With the send button, the saved reading is emailed straight away.
export async function createReadingAction({ request }: ActionFunctionArgs): Promise<JSONResponseUtil | Response> {
  const { intent, reading, photo, email } = parseFormData<NewReadingFormData>(await request.formData());

  try {
    const validReading = await CreateReadingSchema.validate(reading);
    const saveResult = await saveReading(validReading, photo);

    if (!saveResult.success || !saveResult.data) return saveResult;

    if (intent === NewReadingIntent.SEND) return await sendSavedReading(saveResult.data, email);

    return toastOnSuccess(redirect(BASE_ROUTES_PATHS.HOME), SAVED_MESSAGE);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
}
