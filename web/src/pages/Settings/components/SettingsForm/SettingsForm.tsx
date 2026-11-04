import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useId } from 'react';
import { useFetcher } from 'react-router';
import { UpdateSettingsSchema, type UpdateSettings } from '@services/settingsService/settingsService.type';
import type { SettingsApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import TileCard from '@components/TileCard';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Separator } from '@components/ui/separator';
import { createFormData } from '@utils/formDataUtils';
import EmailFields from './components/EmailFields';
import EmailPreview from './components/EmailPreview';
import SaveBar from './components/SaveBar';
import { toSaveFailure } from './settingsFormUtils';

type Props = {
  settings: SettingsApiModel;
};

const TITLE = 'Email';
const DESCRIPTION = 'The email every reading goes out as: who it goes to, what it says, and how it looks.';

function toFormValues({
  to,
  clientNumber,
  subjectTemplate,
  bodyTemplate,
  dateFormat,
  dateLanguage,
}: SettingsApiModel): UpdateSettings {
  return { to: to ?? '', clientNumber: clientNumber ?? '', subjectTemplate, bodyTemplate, dateFormat, dateLanguage };
}

// One Email card, everything in it saved at once: Provider (To, the provider's address, checked as an email address,
// the client number there, and From, shown as it is), then Message (the subject and body templates, checked for unknown placeholders, and the
// date format {date} is written in), then the live Preview, and Save in the card's footer.
// A phone reads it top to bottom, so Save comes after the preview: type, check, save. From lg the fields take the left
// column and the preview the right, sticking to the top so it stays in view while the templates are typed; the card
// lets it stick (`overflow-visible`). The DOM order stays the phone's, so reading and tab order do not change.
function SettingsForm({ settings }: Props) {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so the input would stop reaching the form state.
  'use no memo';

  const { register, control, handleSubmit, formState } = useForm<UpdateSettings>({
    defaultValues: toFormValues(settings),
    resolver: yupResolver(UpdateSettingsSchema),
  });
  const fetcher = useFetcher<JSONResponseUtil>();
  const titleId = useId();

  const isSaving = fetcher.state !== 'idle';
  const { fieldErrors, formError } = toSaveFailure(fetcher);
  const { errors } = formState;
  const toError = errors.to?.message ?? fieldErrors.to;
  const clientNumberError = errors.clientNumber?.message ?? fieldErrors.clientNumber;
  const messageErrors = {
    subjectTemplate: errors.subjectTemplate?.message ?? fieldErrors.subjectTemplate,
    bodyTemplate: errors.bodyTemplate?.message ?? fieldErrors.bodyTemplate,
    dateFormat: errors.dateFormat?.message ?? fieldErrors.dateFormat,
    dateLanguage: errors.dateLanguage?.message ?? fieldErrors.dateLanguage,
  };

  const saveSettings = handleSubmit((values) =>
    fetcher.submit(createFormData({ settings: values }), { method: HttpVerbsUtil.PUT }),
  );

  return (
    <TileCard role="region" aria-labelledby={titleId} className="overflow-visible">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          <h2 id={titleId}>{TITLE}</h2>
        </CardTitle>
        <CardDescription>{DESCRIPTION}</CardDescription>
      </CardHeader>
      <form noValidate onSubmit={(event) => void saveSettings(event)} className="flex flex-col gap-6">
        <CardContent className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
          <EmailFields
            from={settings.from}
            register={register}
            control={control}
            toError={toError}
            clientNumberError={clientNumberError}
            messageErrors={messageErrors}
          />
          <Separator className="lg:hidden" />
          <EmailPreview control={control} from={settings.from} className="lg:sticky lg:top-6" />
        </CardContent>
        <SaveBar formError={formError} isSaving={isSaving} />
      </form>
    </TileCard>
  );
}

export default SettingsForm;
