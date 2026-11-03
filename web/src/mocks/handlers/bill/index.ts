import addBillHandler from './addBill.mock.handler';
import getBillHandler from './getBill.mock.handler';

export const billMockHandlers = (baseUrl: string) => [...addBillHandler(baseUrl), ...getBillHandler(baseUrl)];
