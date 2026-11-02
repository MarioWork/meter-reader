import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import itemService from '@services/itemService/itemService';
import { CreateItemSchema, type CreateItem } from '@services/itemService/itemService.type';
import { parseFormData } from '@utils/formDataUtils';
import type { ItemApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';

type CreateItemFormData = { item: CreateItem };

export const createItemAction = async ({ request }: ActionFunctionArgs): Promise<JSONResponseUtil<ItemApiModel>> => {
  const { item } = parseFormData<CreateItemFormData>(await request.formData());

  try {
    const validItem = await CreateItemSchema.validate(item);

    return await itemService.addItem(validItem);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};
