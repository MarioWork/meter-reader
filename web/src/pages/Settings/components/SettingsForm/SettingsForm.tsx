import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useFetcher, type FetcherWithComponents } from 'react-router';
import { UpdateSettingsSchema, type UpdateSettings } from '@services/settingsService/settingsService.type';
import type { SettingsApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import ErrorAlert from '@components/ErrorAlert';
import { Button } from '@components/ui/button';
import { FieldDescription, FieldLegend, FieldSet } from '@components/ui/field';
import { Spinner } from '@components/ui/spinner';
import { INVALID_EMAIL_MESSAGE } from '@utils/emailUtils';
import { createFormData } from '@utils/formDataUtils';
import { SAVE_FAILED_MESSAGE } from '../../settingsUtils';
import FromAddress from './components/FromAddress';
import ToAddressField from './components/ToAddressField';

type Props = {
  settings: SettingsApiModel;
};

// The API's code for a body that failed its checks: here, an address it does not take as an email address.
const VALIDATION_ERROR_CODE = 'VALIDATION_ERROR';
const LEGEND = 'Email';
const SAVE_LABEL = 'Save';
const LEGEND_HINT = 'Who every reading is emailed from and to.';

type SaveFailure = { fieldError?: string; formError?: string };

// The message for the failed save, split by where it belongs: under the field when the server refused the address,
// in an alert next to the form for anything else.
function toSaveFailureMessages(fetcher: FetcherWithComponents<JSONResponseUtil | undefined>): SaveFailure {
  const isIdle = fetcher.state === 'idle';
  const hasFailed = fetcher.data?.success === false;

  if (!isIdle || !hasFailed) return {};

  const isRefusedAddress = fetcher.data?.error?.code === VALIDATION_ERROR_CODE;

  if (isRefusedAddress) return { fieldError: INVALID_EMAIL_MESSAGE };

  return { formError: fetcher.data?.error?.message ?? SAVE_FAILED_MESSAGE };
}

// From, shown as it is, and To, the provider's address, checked as an email address before it is saved.
function SettingsForm({ settings }: Props) {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so the input would stop reaching the form state.
  'use no memo';

  const { register, handleSubmit, formState } = useForm<UpdateSettings>({
    defaultValues: { to: settings.to ?? '' },
    resolver: yupResolver(UpdateSettingsSchema),
  });
  const fetcher = useFetcher<JSONResponseUtil>();

  const isSaving = fetcher.state !== 'idle';
  const { fieldError, formError } = toSaveFailureMessages(fetcher);
  const toError = formState.errors.to?.message ?? fieldError;

  const saveSettings = handleSubmit((values) =>
    fetcher.submit(createFormData({ settings: values }), { method: HttpVerbsUtil.PUT }),
  );

  return (
    <form noValidate onSubmit={(event) => void saveSettings(event)} className="flex flex-col gap-6">
      <FieldSet className="gap-4">
        <FieldLegend>{LEGEND}</FieldLegend>
        <FieldDescription className="-mt-3">{LEGEND_HINT}</FieldDescription>
        <FromAddress from={settings.from} />
        <ToAddressField error={toError} registration={register('to')} />
      </FieldSet>
      {formError && <ErrorAlert message={formError} />}
      <Button type="submit" size="lg" disabled={isSaving} className="self-end">
        {isSaving && <Spinner aria-hidden="true" />}
        {SAVE_LABEL}
      </Button>
    </form>
  );
}

export default SettingsForm;
