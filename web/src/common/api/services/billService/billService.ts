import axios from 'axios';
import { axiosActions } from '@api/axiosActions';
import type { BillApiModel, BillId } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import type { AddBill } from './billService.type';

const BASE_BILLS_URL = '/bills';
// What the body is sent as when the browser cannot tell: the API reads the real type from the bytes anyway.
const UNKNOWN_CONTENT_TYPE = 'application/octet-stream';
// The file's name on the user's device, which the app shows the bill by. Percent-encoded: a header holds ASCII only.
export const BILL_NAME_HEADER = 'X-Bill-File-Name';
// The answer is the file itself, not JSON.
const FILE_RESPONSE = 'blob';

export default {
  // The file itself, fetched by the signed-in app: a phone's home-screen app opens it without a tab of its own.
  getBill: async (id: BillId): Promise<Blob> => {
    const response = await axios.get<Blob>(`${BASE_BILLS_URL}/${id}`, { responseType: FILE_RESPONSE });

    return response.data;
  },

  // The body is the file itself, not JSON or a form. Updating the reading with the answer's id links the two.
  addBill: async (bill: AddBill): Promise<JSONResponseUtil<BillApiModel>> =>
    axiosActions<BillApiModel>({
      url: BASE_BILLS_URL,
      method: HttpVerbsUtil.POST,
      data: bill,
      headers: { 'Content-Type': bill.type || UNKNOWN_CONTENT_TYPE, [BILL_NAME_HEADER]: encodeURIComponent(bill.name) },
    }),
};
