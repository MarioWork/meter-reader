import { mixed, number, object, type InferType } from 'yup';

// The file the user picked. Its type and size are the API's to judge: it reads the type from the file's own bytes,
// and its reason (a PDF of at most 10 MB) is what the field shows.
export const AddBillSchema = mixed<File>().required();

export type AddBill = InferType<typeof AddBillSchema>;

// The bill a viewer url names.
export const BillParamsSchema = object({
  billId: number().integer().positive().required(),
});
