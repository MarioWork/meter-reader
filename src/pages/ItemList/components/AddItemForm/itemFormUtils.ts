import { object, type InferType } from 'yup';
import type { CreateItem } from '@services/itemService/itemService.type';
import { itemNameSchema } from '@utils/itemUtils';

export const itemFormSchema = object({
  name: itemNameSchema,
});

export type ItemFormValues = InferType<typeof itemFormSchema>;

export const getInitialValues = (): ItemFormValues => ({ name: '' });

export const toPayload = (values: ItemFormValues): CreateItem => ({ name: values.name });
