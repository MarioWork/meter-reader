import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useFetcher, useLoaderData, useLocation, useNavigate } from 'react-router';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { HttpVerbsUtil, type JSONResponseUtil, type LoaderDataUtil } from '@app-types/utility';
import { useFetcherFailure } from '@hooks/useFetcherFailure';
import { createFormData } from '@utils/formDataUtils';
import type { UpdateCostAndBillFormData } from '../types';
import { costAndBillFormSchema, toCostCents, toCostText, type CostAndBillFormValues } from '../costAndBillFormUtils';
import type { loader } from '../costAndBillModalLoader';

const FAILURE_MESSAGE = 'The cost could not be saved. Please try again.';

// The dialog's form and its save. The Cost field starts from the saved cost; saving it empty removes the cost.
export function useCostAndBill() {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  'use no memo';

  const { reading } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const { register, handleSubmit, formState } = useForm<CostAndBillFormValues>({
    defaultValues: { cost: toCostText(reading.costCents) },
    resolver: yupResolver(costAndBillFormSchema),
  });
  const fetcher = useFetcher<JSONResponseUtil>();
  const failureMessage = useFetcherFailure(fetcher, FAILURE_MESSAGE);
  const navigate = useNavigate();
  const { search } = useLocation();

  const isSaving = fetcher.state !== 'idle';

  // Back to the same page of the history. Not while the save runs: it closes the dialog itself once it is done.
  const handleOpenChange = (isOpening: boolean) => {
    if (isOpening || isSaving) return;

    void navigate({ pathname: BASE_ROUTES_PATHS.HOME, search });
  };

  const saveCostAndBill = handleSubmit(({ cost }) => {
    const formData: UpdateCostAndBillFormData = { changes: { costCents: toCostCents(cost) } };

    return fetcher.submit(createFormData(formData), { method: HttpVerbsUtil.PATCH });
  });

  return {
    reading,
    register,
    costError: formState.errors.cost?.message,
    isSaving,
    failureMessage,
    handleOpenChange,
    saveCostAndBill,
  };
}
