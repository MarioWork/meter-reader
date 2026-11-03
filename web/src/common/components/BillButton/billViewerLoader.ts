import type { LoaderFunctionArgs } from 'react-router';
import { isUnauthorizedFailure } from '@api/axiosActions';
import type { BillId } from '@app-types/models';
import billService from '@services/billService/billService';
import { BillParamsSchema } from '@services/billService/billService.type';
import { openPdfDocument } from './pdfDocumentUtils';
import type { BillDocument } from './types';

async function openBill(billId: BillId): Promise<BillDocument> {
  const file = await billService.getBill(billId);
  const pdf = await openPdfDocument(file);

  return { ...pdf, file };
}

// One bill, fetched by the signed-in app and read by pdf.js, for the viewer's fetcher. A bill that cannot be fetched or
// read is no error page: the viewer says so and offers Try again. A lost session still throws, so authMiddleware sends
// the browser to the login page.
export async function loader({ params }: LoaderFunctionArgs) {
  const { billId } = await BillParamsSchema.validate(params);

  try {
    const billDocument: BillDocument | null = await openBill(billId);

    return { billDocument };
  } catch (error) {
    if (isUnauthorizedFailure(error)) throw error;

    return { billDocument: null };
  }
}
