import { object, type InferType } from 'yup';
import { itemNameSchema } from '@utils/itemUtils';

export const CreateItemSchema = object({
  name: itemNameSchema,
});

export type CreateItem = InferType<typeof CreateItemSchema>;
