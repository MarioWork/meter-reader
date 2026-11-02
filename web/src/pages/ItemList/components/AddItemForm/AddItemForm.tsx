import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router';
import { createFormData } from '@utils/formDataUtils';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { getInitialValues, itemFormSchema, toPayload, type ItemFormValues } from './itemFormUtils';

const NAME_ERROR_ID = 'item-name-error';

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700';

function AddItemForm() {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so `reset()` could never reach the DOM again.
  'use no memo';

  const { register, handleSubmit, reset, formState } = useForm<ItemFormValues>({
    defaultValues: getInitialValues(),
    resolver: yupResolver(itemFormSchema),
  });

  const fetcher = useFetcher<JSONResponseUtil>();

  // The router owns the submission, so the form only learns the outcome through fetcher.data.
  useEffect(() => {
    if (fetcher.data?.success) reset(getInitialValues());
  }, [fetcher.data, reset]);

  const onSubmit = handleSubmit((values) =>
    fetcher.submit(createFormData({ item: toPayload(values) }), { method: HttpVerbsUtil.POST }),
  );

  const nameError = formState.errors.name?.message;
  const hasRequestFailed = fetcher.data?.success === false;
  const isSubmitting = fetcher.state === 'submitting';

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-2">
      <label htmlFor="item-name">Name</label>
      <input
        id="item-name"
        className={`rounded-sm border border-gray-300 px-2 py-1 ${FOCUS_RING}`}
        aria-invalid={nameError !== undefined}
        aria-describedby={nameError ? NAME_ERROR_ID : undefined}
        {...register('name')}
      />
      {nameError && (
        <p id={NAME_ERROR_ID} className="text-red-700">
          {nameError}
        </p>
      )}
      {hasRequestFailed && (
        <p role="alert" className="text-red-700">
          Something went wrong. Please try again.
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`self-start rounded-sm bg-blue-700 px-3 py-1 text-white ${FOCUS_RING}`}
      >
        Add item
      </button>
    </form>
  );
}

export default AddItemForm;
