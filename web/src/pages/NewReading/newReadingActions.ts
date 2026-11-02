import { redirect, type ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import photoService from '@services/photoService/photoService';
import { AddPhotoSchema } from '@services/photoService/photoService.type';
import readingService from '@services/readingService/readingService';
import { CreateReadingSchema } from '@services/readingService/readingService.type';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { JSONResponseUtil } from '@app-types/utility';
import { parseFormData } from '@utils/formDataUtils';
import type { NewReadingFormData } from './newReadingUtils';

// Saved, the app goes back to Home, where the new reading tops the history. A reading lower than the last one is
// saved too: the form only warns about it. The photo goes up first and the reading is saved with its id, so a failed
// upload saves nothing and the user can simply try again.
export const createReadingAction = async ({ request }: ActionFunctionArgs): Promise<JSONResponseUtil | Response> => {
  const { reading, photo } = parseFormData<NewReadingFormData>(await request.formData());

  try {
    const validReading = await CreateReadingSchema.validate(reading);
    const validPhoto = photo ? await AddPhotoSchema.validate(photo) : undefined;
    const photoResult = validPhoto ? await photoService.addPhoto(validPhoto) : undefined;

    if (photoResult && !photoResult.success) return photoResult;

    const result = await readingService.addReading({ ...validReading, photoId: photoResult?.data?.id });

    if (!result.success) return result;

    return redirect(BASE_ROUTES_PATHS.HOME);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};
