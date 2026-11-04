import { redirect, type ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import photoService from '@services/photoService/photoService';
import { AddPhotoSchema } from '@services/photoService/photoService.type';
import readingService from '@services/readingService/readingService';
import {
  AddReadingPhotoSchema,
  ReadingParamsSchema,
  SendReadingSchema,
  type SendReading,
} from '@services/readingService/readingService.type';
import type { JSONResponseUtil } from '@app-types/utility';
import { parseFormData } from '@utils/formDataUtils';
import { redirectBehindReadingModal } from '@utils/readingModalUtils';
import { toastOnSuccess } from '@utils/toastUtils';
import { ADD_PHOTO_INTENT, PHOTO_FIELD, SEND_INTENT_FIELD } from './sendReadingModalUtils';

const SENT_MESSAGE = 'Reading sent';
const PHOTO_ADDED_MESSAGE = 'Photo added';
const NO_PHOTO_MESSAGE = 'Pick a photo to add.';

async function sendReading(formData: FormData, url: string, readingId: number): Promise<JSONResponseUtil | Response> {
  const fields = parseFormData<SendReading>(formData);

  try {
    const validFields = await SendReadingSchema.validate(fields);

    const result = await readingService.sendReading(readingId, validFields);

    if (!result.success) return result;

    return redirect(redirectBehindReadingModal(url, readingId));
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
}

// The photo, already shrunk on the device (useAddEmailPhoto), checked against the photo service's schema, uploaded,
// then linked to the reading, which had none, after its own check. The preview stays open; its loader runs again, so the photo
// shows up, ready to attach. A photo or a link that fails its check answers `{ success: false }`.
async function addPhoto(formData: FormData, readingId: number): Promise<JSONResponseUtil> {
  const picked = formData.get(PHOTO_FIELD);

  if (!(picked instanceof Blob)) return { success: false, error: { message: NO_PHOTO_MESSAGE } };

  try {
    const validPhoto = await AddPhotoSchema.validate(picked);
    const uploaded = await photoService.addPhoto(validPhoto);

    if (!uploaded.success || !uploaded.data) return uploaded;

    const validLink = await AddReadingPhotoSchema.validate({ photoId: uploaded.data.id });

    return await readingService.addReadingPhoto(readingId, validLink);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
}

// The reading's id from the url, or undefined when it is not one.
async function readingIdOf(params: ActionFunctionArgs['params']): Promise<number | undefined> {
  try {
    const { readingId } = await ReadingParamsSchema.validate(params);

    return readingId;
  } catch (error) {
    if (error instanceof ValidationError) return undefined;

    throw error;
  }
}

async function sendOrAddPhoto({ request, params }: ActionFunctionArgs): Promise<JSONResponseUtil | Response> {
  const readingId = await readingIdOf(params);

  if (readingId === undefined) return { success: false };

  // Read once, for whichever write it is.
  const formData = await request.formData();

  if (formData.get(SEND_INTENT_FIELD) === ADD_PHOTO_INTENT) {
    return toastOnSuccess(await addPhoto(formData, readingId), PHOTO_ADDED_MESSAGE);
  }

  return toastOnSuccess(await sendReading(formData, request.url, readingId), SENT_MESSAGE);
}

// The preview's two writes. Send: sent, the preview closes onto the page it opened over (the same page of the
// history, or the reading's own page), where the reading now shows as sent; not sent, the preview stays open with the
// server's reason, and the API has marked the reading failed. Add photo: a reading saved without one gets one, and
// the preview stays open. A toast confirms either.
export const sendReadingAction = sendOrAddPhoto;
