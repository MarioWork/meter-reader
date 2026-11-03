import { axiosActions } from '@api/axiosActions';
import type { BillApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import type { AddBill } from './billService.type';

// Also the path a saved bill opens and downloads from (getBillUrl, next to the history).
export const BASE_BILLS_URL = '/bills';
// What the body is sent as when the browser cannot tell: the API reads the real type from the bytes anyway.
const UNKNOWN_CONTENT_TYPE = 'application/octet-stream';

export default {
  // The body is the file itself, not JSON or a form. Updating the reading with the answer's id links the two.
  addBill: async (bill: AddBill): Promise<JSONResponseUtil<BillApiModel>> =>
    axiosActions<BillApiModel>({
      url: BASE_BILLS_URL,
      method: HttpVerbsUtil.POST,
      data: bill,
      headers: { 'Content-Type': bill.type || UNKNOWN_CONTENT_TYPE },
    }),
};
