import { useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useWatch } from 'react-hook-form';
import { useFetcher } from 'react-router';
import type { EmailDefaultsApiModel, ReadingApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import ErrorAlert from '@components/ErrorAlert';
import ProviderEmailMissingNote from '@components/ProviderEmailMissingNote';
import { FieldGroup } from '@components/ui/field';
import { useFetcherFailure } from '@hooks/useFetcherFailure';
import { createFormData } from '@utils/formDataUtils';
import { fillTodaysEmail } from '@utils/messageTemplateUtils';
import { isReadingLower, readingDigitsSchema } from '@utils/readingUtils';
import { NewReadingIntent, SAVE_FAILED_MESSAGE, type NewReadingEmail } from '../../newReadingUtils';
import LowerReadingWarning from './components/LowerReadingWarning';
import ReadingDigitsField from './components/ReadingDigitsField';
import PhotoPicker from './components/PhotoPicker';
import { useReadingPhoto } from './hooks/useReadingPhoto';
import NewReadingButtons from './components/NewReadingButtons';
import NewReadingEmailFields from './components/NewReadingEmailFields';
import {
  getInitialValues,
  newReadingFormSchema,
  toEmail,
  toPayload,
  type NewReadingFormValues,
} from './newReadingFormUtils';

type Props = {
  lastReading?: ReadingApiModel;
  emailDefaults: EmailDefaultsApiModel;
};

const WARNING_ID = 'reading-lower-warning';
// The router sends a FormData url-encoded unless told otherwise, which turns the photo into its file name.
const WITH_FILES = 'multipart/form-data';

// Only digits that would pass are compared: half-typed or invalid input gets its error, not a warning.
function isLowerThanLast(digits: string, lastReading?: ReadingApiModel): boolean {
  const hasLastReading = lastReading !== undefined;
  const isValidReading = readingDigitsSchema.isValidSync(digits);

  if (!hasLastReading || !isValidReading) return false;

  return isReadingLower(digits.trim(), lastReading.digits);
}

// Only a send carries the email; a save leaves it out.
function emailFor(intent: NewReadingIntent, values: NewReadingFormValues): NewReadingEmail | undefined {
  if (intent !== NewReadingIntent.SEND) return undefined;

  return toEmail(values);
}

function NewReadingForm({ lastReading, emailDefaults }: Props) {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so the inputs would stop reaching the form state.
  'use no memo';

  const { register, handleSubmit, formState, control, getValues, getFieldState, setValue, setFocus } =
    useForm<NewReadingFormValues>({
      defaultValues: getInitialValues(emailDefaults),
      resolver: yupResolver(newReadingFormSchema),
    });

  const fetcher = useFetcher<JSONResponseUtil>();
  const { photo, previewUrl, isShrinking, errorMessage, isFindingDigits, hasFoundNothing, pickPhoto, removePhoto } =
    useReadingPhoto({
      getDigits: () => getValues('digits'),
      // Filled in as if typed, so the digits are checked and compared with the last reading the same way.
      fillDigits: (digits) => setValue('digits', digits, { shouldDirty: true, shouldValidate: formState.isSubmitted }),
    });

  // Both buttons check the form the same way; they only differ in what the action does once it is saved.
  function submitReading(intent: NewReadingIntent) {
    return handleSubmit((values) =>
      fetcher.submit(createFormData({ intent, reading: toPayload(values), photo, email: emailFor(intent, values) }), {
        method: HttpVerbsUtil.POST,
        encType: WITH_FILES,
      }),
    );
  }

  const digits = useWatch({ control, name: 'digits' });

  // The subject and the message follow the digits, so they always read as the email that would go out, each until the
  // user edits it.
  useEffect(() => {
    const filled = fillTodaysEmail(emailDefaults, digits);

    if (!getFieldState('subject').isDirty) setValue('subject', filled.subject);

    if (!getFieldState('body').isDirty) setValue('body', filled.body);
  }, [digits, emailDefaults, getFieldState, setValue]);
  const isLower = isLowerThanLast(digits, lastReading);
  const isSaving = fetcher.state !== 'idle';
  const canSave = !isSaving && !isShrinking;
  const hasProviderEmail = emailDefaults.to !== null;
  const failureMessage = useFetcherFailure(fetcher, SAVE_FAILED_MESSAGE);

  return (
    <form
      onSubmit={(event) => void submitReading(NewReadingIntent.SAVE)(event)}
      noValidate
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <PhotoPicker
          previewUrl={previewUrl}
          isShrinking={isShrinking}
          isFindingDigits={isFindingDigits}
          hasFoundNothing={hasFoundNothing}
          errorMessage={errorMessage}
          onPick={(picked) => void pickPhoto(picked)}
          onRemove={removePhoto}
          onSkip={() => setFocus('digits')}
        />
        <ReadingDigitsField
          error={formState.errors.digits?.message}
          warningId={isLower ? WARNING_ID : undefined}
          registration={register('digits')}
        />
        {isLower && lastReading && <LowerReadingWarning id={WARNING_ID} lastReading={lastReading} />}
      </FieldGroup>
      <NewReadingEmailFields emailDefaults={emailDefaults} register={register} errors={formState.errors} />
      {!hasProviderEmail && <ProviderEmailMissingNote />}
      {failureMessage && <ErrorAlert message={failureMessage} />}
      <NewReadingButtons
        isDisabled={!canSave}
        isSendDisabled={!hasProviderEmail}
        onSend={(event) => void submitReading(NewReadingIntent.SEND)(event)}
      />
    </form>
  );
}

export default NewReadingForm;
