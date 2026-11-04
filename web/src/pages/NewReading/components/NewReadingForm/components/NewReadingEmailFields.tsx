import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { EmailDefaultsApiModel } from '@app-types/models';
import EmailAddresses from '@components/EmailAddresses';
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import type { NewReadingFormValues } from '../newReadingFormUtils';

type Props = {
  emailDefaults: EmailDefaultsApiModel;
  register: UseFormRegister<NewReadingFormValues>;
  errors: FieldErrors<NewReadingFormValues>;
};

const LEGEND = 'Email';
const LEGEND_HINT = 'Goes out when you press Send. Filled in from the templates in Settings.';
const SUBJECT_ID = 'new-reading-subject';
const SUBJECT_ERROR_ID = 'new-reading-subject-error';
const BODY_ID = 'new-reading-body';
const BODY_HINT_ID = 'new-reading-body-hint';
const BODY_ERROR_ID = 'new-reading-body-error';
const BODY_HINT = 'The message that goes out. It follows the reading until you change it.';
const BODY_ROWS = 3;

// The email a send straight away goes out with: who it is from and to, and the subject and message, filled in from the
// templates in Settings. Save alone ignores it.
function NewReadingEmailFields({ emailDefaults, register, errors }: Props) {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so the input would stop reaching the form state.
  'use no memo';

  const subjectError = errors.subject?.message;
  const bodyError = errors.body?.message;
  const hasSubjectError = subjectError !== undefined;
  const hasBodyError = bodyError !== undefined;

  return (
    <FieldSet className="gap-4">
      <FieldLegend>{LEGEND}</FieldLegend>
      <FieldDescription className="-mt-3">{LEGEND_HINT}</FieldDescription>
      <EmailAddresses from={emailDefaults.from} to={emailDefaults.to} className="rounded-lg border bg-muted/40 p-3" />
      <Field data-invalid={hasSubjectError}>
        <FieldLabel htmlFor={SUBJECT_ID}>Subject</FieldLabel>
        <Input
          id={SUBJECT_ID}
          aria-invalid={hasSubjectError}
          aria-describedby={hasSubjectError ? SUBJECT_ERROR_ID : undefined}
          {...register('subject')}
        />
        <FieldError id={SUBJECT_ERROR_ID}>{subjectError}</FieldError>
      </Field>
      <Field data-invalid={hasBodyError}>
        <FieldLabel htmlFor={BODY_ID}>Message</FieldLabel>
        <Textarea
          id={BODY_ID}
          rows={BODY_ROWS}
          aria-invalid={hasBodyError}
          aria-describedby={hasBodyError ? `${BODY_HINT_ID} ${BODY_ERROR_ID}` : BODY_HINT_ID}
          {...register('body')}
        />
        <FieldDescription id={BODY_HINT_ID}>{BODY_HINT}</FieldDescription>
        <FieldError id={BODY_ERROR_ID}>{bodyError}</FieldError>
      </Field>
    </FieldSet>
  );
}

export default NewReadingEmailFields;
