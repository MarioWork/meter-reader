import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { EmailText } from '@services/readingService/readingService.type';
import { Field, FieldError, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';

type Props = {
  register: UseFormRegister<EmailText>;
  errors: FieldErrors<EmailText>;
  isDisabled: boolean;
};

const SUBJECT_ID = 'send-reading-subject';
const SUBJECT_ERROR_ID = 'send-reading-subject-error';
const BODY_ID = 'send-reading-body';
const BODY_ERROR_ID = 'send-reading-body-error';
const BODY_ROWS = 5;

// The subject and the message, filled in as the server wrote them, for the user to change before it goes. Each error
// sits under its own field and describes it.
function EmailTextFields({ register, errors, isDisabled }: Props) {
  const subjectError = errors.subject?.message;
  const bodyError = errors.body?.message;
  const hasSubjectError = subjectError !== undefined;
  const hasBodyError = bodyError !== undefined;

  return (
    <FieldGroup className="gap-4">
      <Field data-invalid={hasSubjectError}>
        <FieldLabel htmlFor={SUBJECT_ID}>Subject</FieldLabel>
        <Input
          id={SUBJECT_ID}
          disabled={isDisabled}
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
          disabled={isDisabled}
          className="font-mono"
          aria-invalid={hasBodyError}
          aria-describedby={hasBodyError ? BODY_ERROR_ID : undefined}
          {...register('body')}
        />
        <FieldError id={BODY_ERROR_ID}>{bodyError}</FieldError>
      </Field>
    </FieldGroup>
  );
}

export default EmailTextFields;
