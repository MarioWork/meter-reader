import { redirect, type ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import readingService from '@services/readingService/readingService';
import { CreateReadingSchema } from '@services/readingService/readingService.type';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { JSONResponseUtil } from '@app-types/utility';
import { parseFormData } from '@utils/formDataUtils';
import type { NewReadingFormData } from './newReadingUtils';

// Saved, the app goes back to Home, where the new reading tops the history. A reading lower than the last one is
// saved too: the form only warns about it.
export const createReadingAction = async ({ request }: ActionFunctionArgs): Promise<JSONResponseUtil | Response> => {
  const { reading } = parseFormData<NewReadingFormData>(await request.formData());

  try {
    const validReading = await CreateReadingSchema.validate(reading);
    const result = await readingService.addReading(validReading);

    if (!result.success) return result;

    return redirect(BASE_ROUTES_PATHS.HOME);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};
