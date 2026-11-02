import { string } from 'yup';

export const ITEM_NAME_MAX_LENGTH = 100;

export const itemNameSchema = string()
  .trim()
  .required('Name is required')
  .max(ITEM_NAME_MAX_LENGTH, `Name must be at most ${ITEM_NAME_MAX_LENGTH} characters`);
