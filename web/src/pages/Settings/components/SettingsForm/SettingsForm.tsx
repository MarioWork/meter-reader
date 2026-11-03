import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router';
import { UpdateSettingsSchema, type UpdateSettings } from '@services/settingsService/settingsService.type';
import type { SettingsApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import ErrorAlert from '@components/ErrorAlert';
import { Button } from '@components/ui/button';
import { FieldDescription, FieldLegend, FieldSet } from '@components/ui/field';
import { Spinner } from '@components/ui/spinner';
import { createFormData } from '@utils/formDataUtils';
import EmailPreview from './components/EmailPreview';
import FromAddress from './components/FromAddress';
import MessageFields from './components/MessageFields';
import ToAddressField from './components/ToAddressField';
import { toSaveFailure } from './settingsFormUtils';

type Props = {
  settings: SettingsApiModel;
};

const LEGEND = 'Email';
const SAVE_LABEL = 'Save';
const LEGEND_HINT = 'Who every reading is emailed from and to.';

function toFormValues({ to, subjectTemplate, bodyTemplate, dateFormat }: SettingsApiModel): UpdateSettings {
  return { to: to ?? '', subjectTemplate, bodyTemplate, dateFormat };
}

// From, shown as it is; To, the provider's address, checked as an email address; and the subject and body templates,
// checked for unknown placeholders; and the date format {date} is written in. All of it is saved at once.
function SettingsForm({ settings }: Props) {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so the input would stop reaching the form state.
  'use no memo';

  const { register, control, handleSubmit, formState } = useForm<UpdateSettings>({
    defaultValues: toFormValues(settings),
    resolver: yupResolver(UpdateSettingsSchema),
  });
  const fetcher = useFetcher<JSONResponseUtil>();

  const isSaving = fetcher.state !== 'idle';
  const { fieldErrors, formError } = toSaveFailure(fetcher);
  const { errors } = formState;
  const toError = errors.to?.message ?? fieldErrors.to;
  const messageErrors = {
    subjectTemplate: errors.subjectTemplate?.message ?? fieldErrors.subjectTemplate,
    bodyTemplate: errors.bodyTemplate?.message ?? fieldErrors.bodyTemplate,
    dateFormat: errors.dateFormat?.message ?? fieldErrors.dateFormat,
  };

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
      <MessageFields register={register} errors={messageErrors} />
      <EmailPreview control={control} from={settings.from} />
      {formError && <ErrorAlert message={formError} />}
      <Button type="submit" size="lg" disabled={isSaving} className="self-end">
        {isSaving && <Spinner aria-hidden="true" />}
        {SAVE_LABEL}
      </Button>
    </form>
  );
}

export default SettingsForm;
