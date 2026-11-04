import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useFetcher, useLoaderData, useNavigate } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil, type LoaderDataUtil } from '@app-types/utility';
import { usePageBehindReadingModal } from '@hooks/usePageBehindReadingModal';
import { createFormData } from '@utils/formDataUtils';
import type { UpdateCostAndBillFormData } from '../types';
import {
  costAndBillFormSchema,
  toCostCents,
  toCostText,
  toSaveFailure,
  type CostAndBillFormValues,
} from '../costAndBillFormUtils';
import type { loader } from '../costAndBillModalLoader';
import { useBillChoice } from './useBillChoice';

const FAILURE_MESSAGE = 'The cost and bill could not be saved. Please try again.';
// The bill file goes to the action as it is: a urlencoded submit would drop it.
const WITH_FILES = 'multipart/form-data';

// The dialog's form and its save. The Cost field starts from the saved cost; saving it empty removes the cost. A new
// bill file replaces the saved bill; Remove bill takes it away. A bill left alone stays as it is.
export function useCostAndBill() {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  'use no memo';

  const { reading } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const { register, handleSubmit, formState } = useForm<CostAndBillFormValues>({
    defaultValues: { cost: toCostText(reading.costCents) },
    resolver: yupResolver(costAndBillFormSchema),
  });
  const { billFile, isBillRemoved, chooseBillFile, toggleBillRemoved } = useBillChoice();
  const fetcher = useFetcher<JSONResponseUtil>();
  const navigate = useNavigate();
  const pageBehind = usePageBehindReadingModal();

  const isSaving = fetcher.state !== 'idle';
  const { billError, formError } = isSaving ? {} : toSaveFailure(fetcher.data, FAILURE_MESSAGE);

  // Back to the page it opened over. Not while the save runs: it closes the dialog itself once it is done.
  const handleOpenChange = (isOpening: boolean) => {
    if (isOpening || isSaving) return;

    void navigate(pageBehind);
  };

  const saveCostAndBill = handleSubmit(({ cost }) => {
    // A new file is uploaded by the action, which links it; without one, a removed bill is sent as null.
    const isRemovingBill = isBillRemoved && billFile === undefined;
    const changes = { costCents: toCostCents(cost), billId: isRemovingBill ? null : undefined };
    const formData: UpdateCostAndBillFormData = { changes, bill: billFile };

    return fetcher.submit(createFormData(formData), { method: HttpVerbsUtil.PATCH, encType: WITH_FILES });
  });

  return {
    reading,
    register,
    costError: formState.errors.cost?.message,
    billError,
    isBillRemoved,
    chosenBillFileName: billFile?.name,
    chooseBillFile,
    toggleBillRemoved,
    isSaving,
    failureMessage: formError,
    handleOpenChange,
    saveCostAndBill,
  };
}
