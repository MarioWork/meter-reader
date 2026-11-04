import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router';
import { UpdateSettingsSchema, type UpdateSettings } from '@services/settingsService/settingsService.type';
import type { SettingsApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { createFormData } from '@utils/formDataUtils';
import EmailAddressesCard from './components/EmailAddressesCard';
import EmailPreview from './components/EmailPreview';
import MessageCard from './components/MessageCard';
import SaveBar from './components/SaveBar';
import { toSaveFailure } from './settingsFormUtils';

type Props = {
  settings: SettingsApiModel;
};

function toFormValues({ to, subjectTemplate, bodyTemplate, dateFormat }: SettingsApiModel): UpdateSettings {
  return { to: to ?? '', subjectTemplate, bodyTemplate, dateFormat };
}

// Two cards of fields saved at once: Email addresses (To, the provider's address, checked as an email address, and
// From, shown as it is) and Message (the subject and body templates, checked for unknown placeholders, and the date
// format {date} is written in), then the live Preview card, then the save bar.
// A phone reads it top to bottom, so Save comes after the preview: type, check, save. From lg the two field cards and
// the save bar fill the left column and the preview takes the right, across all three rows and sticking to the top,
// so it stays in view while the templates are typed. The DOM order stays the phone's, so reading and tab order do not
// change with the width.
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
    <form
      noValidate
      onSubmit={(event) => void saveSettings(event)}
      className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start"
    >
      <EmailAddressesCard from={settings.from} register={register} toError={toError} />
      <MessageCard register={register} errors={messageErrors} />
      <div className="lg:sticky lg:top-6 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-start">
        <EmailPreview control={control} from={settings.from} />
      </div>
      <SaveBar formError={formError} isSaving={isSaving} />
    </form>
  );
}

export default SettingsForm;
