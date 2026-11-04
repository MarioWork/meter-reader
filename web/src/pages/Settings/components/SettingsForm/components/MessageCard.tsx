import type { UseFormRegister } from 'react-hook-form';
import type { UpdateSettings } from '@services/settingsService/settingsService.type';
import { FieldGroup } from '@components/ui/field';
import { MESSAGE_PLACEHOLDERS } from '@utils/messageTemplateUtils';
import SettingsCard from '../../SettingsCard';
import DateFormatField from './DateFormatField';
import PlaceholderList from './PlaceholderList';
import TemplateField from './TemplateField';

type MessageErrors = { subjectTemplate?: string; bodyTemplate?: string; dateFormat?: string };

type Props = {
  register: UseFormRegister<UpdateSettings>;
  errors: MessageErrors;
};

const TITLE = 'Message';
const DESCRIPTION = 'What every email says to start with. You can still change it before each send.';
const SUBJECT_TEMPLATE_LABEL = 'Subject template';
const BODY_TEMPLATE_LABEL = 'Body template';
const SUBJECT_TEMPLATE_ID = 'settings-subject-template';
const BODY_TEMPLATE_ID = 'settings-body-template';
const SUBJECT_TEMPLATE_HINT = `For example: Leitura ${MESSAGE_PLACEHOLDERS.date}`;
const BODY_TEMPLATE_HINT = `For example: Leitura - ${MESSAGE_PLACEHOLDERS.reading} - ${MESSAGE_PLACEHOLDERS.date}`;

// The two placeholders, the subject and body templates that hold them, and how {date} is written in them.
function MessageCard({ register, errors }: Props) {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so the input would stop reaching the form state.
  'use no memo';

  return (
    <SettingsCard title={TITLE} description={DESCRIPTION}>
      <PlaceholderList />
      <FieldGroup className="gap-4">
        <TemplateField
          id={SUBJECT_TEMPLATE_ID}
          label={SUBJECT_TEMPLATE_LABEL}
          hint={SUBJECT_TEMPLATE_HINT}
          error={errors.subjectTemplate}
          registration={register('subjectTemplate')}
        />
        <TemplateField
          id={BODY_TEMPLATE_ID}
          label={BODY_TEMPLATE_LABEL}
          hint={BODY_TEMPLATE_HINT}
          error={errors.bodyTemplate}
          isMultiline
          registration={register('bodyTemplate')}
        />
        <DateFormatField error={errors.dateFormat} registration={register('dateFormat')} />
      </FieldGroup>
    </SettingsCard>
  );
}

export default MessageCard;
