import type { UseFormRegister } from 'react-hook-form';
import type { UpdateSettings } from '@services/settingsService/settingsService.type';
import { FieldDescription, FieldLegend, FieldSet } from '@components/ui/field';
import { MESSAGE_PLACEHOLDERS } from '@utils/messageTemplateUtils';
import TemplateField from './TemplateField';

type TemplateErrors = { subjectTemplate?: string; bodyTemplate?: string };

type Props = {
  register: UseFormRegister<UpdateSettings>;
  errors: TemplateErrors;
};

const LEGEND = 'Message';
const LEGEND_HINT = `Every email starts from these, and you can still change it before each send. ${MESSAGE_PLACEHOLDERS.reading} becomes the reading as read, ${MESSAGE_PLACEHOLDERS.date} the day it was read.`;
const SUBJECT_TEMPLATE_LABEL = 'Subject template';
const BODY_TEMPLATE_LABEL = 'Body template';
const SUBJECT_TEMPLATE_ID = 'settings-subject-template';
const BODY_TEMPLATE_ID = 'settings-body-template';
const SUBJECT_TEMPLATE_HINT = `For example: Leitura ${MESSAGE_PLACEHOLDERS.date}`;
const BODY_TEMPLATE_HINT = `For example: Leitura - ${MESSAGE_PLACEHOLDERS.reading} - ${MESSAGE_PLACEHOLDERS.date}`;

// The subject and body templates, with the two placeholders they can hold.
function MessageTemplatesFields({ register, errors }: Props) {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so the input would stop reaching the form state.
  'use no memo';

  return (
    <FieldSet className="gap-4">
      <FieldLegend>{LEGEND}</FieldLegend>
      <FieldDescription className="-mt-3">{LEGEND_HINT}</FieldDescription>
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
    </FieldSet>
  );
}

export default MessageTemplatesFields;
