import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useWatch } from 'react-hook-form';
import { useFetcher } from 'react-router';
import type { ReadingApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { Button } from '@components/ui/button';
import ErrorAlert from '@components/ErrorAlert';
import { FieldGroup } from '@components/ui/field';
import { useFetcherFailure } from '@hooks/useFetcherFailure';
import { createFormData } from '@utils/formDataUtils';
import { isReadingLower, readingDigitsSchema } from '@utils/readingUtils';
import { SAVE_FAILED_MESSAGE } from '../../newReadingUtils';
import LowerReadingWarning from './components/LowerReadingWarning';
import ReadingDateField from './components/ReadingDateField';
import ReadingDigitsField from './components/ReadingDigitsField';
import PhotoDigitsStatus from './components/PhotoDigitsStatus';
import PhotoPicker from './components/PhotoPicker';
import { useReadingPhoto } from './hooks/useReadingPhoto';
import { getInitialValues, newReadingFormSchema, toPayload, type NewReadingFormValues } from './newReadingFormUtils';

type Props = {
  lastReading?: ReadingApiModel;
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

function NewReadingForm({ lastReading }: Props) {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so the inputs would stop reaching the form state.
  'use no memo';

  const { register, handleSubmit, formState, control, getValues, setValue } = useForm<NewReadingFormValues>({
    defaultValues: getInitialValues(),
    resolver: yupResolver(newReadingFormSchema),
  });

  const fetcher = useFetcher<JSONResponseUtil>();
  const { photo, previewUrl, isShrinking, errorMessage, isFindingDigits, hasFoundNothing, pickPhoto, removePhoto } =
    useReadingPhoto({
      getDigits: () => getValues('digits'),
      // Filled in as if typed, so the digits are checked and compared with the last reading the same way.
      fillDigits: (digits) => setValue('digits', digits, { shouldDirty: true, shouldValidate: formState.isSubmitted }),
    });

  const onSubmit = handleSubmit((values) =>
    fetcher.submit(createFormData({ reading: toPayload(values), photo }), {
      method: HttpVerbsUtil.POST,
      encType: WITH_FILES,
    }),
  );

  const digits = useWatch({ control, name: 'digits' });
  const isLower = isLowerThanLast(digits, lastReading);
  const isSaving = fetcher.state !== 'idle';
  const canSave = !isSaving && !isShrinking;
  const failureMessage = useFetcherFailure(fetcher, SAVE_FAILED_MESSAGE);

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <ReadingDigitsField
          error={formState.errors.digits?.message}
          warningId={isLower ? WARNING_ID : undefined}
          registration={register('digits')}
        />
        {isLower && lastReading && <LowerReadingWarning id={WARNING_ID} lastReading={lastReading} />}
        <PhotoDigitsStatus isFindingDigits={isFindingDigits} hasFoundNothing={hasFoundNothing} />
        <ReadingDateField error={formState.errors.date?.message} registration={register('date')} />
        <PhotoPicker
          previewUrl={previewUrl}
          isShrinking={isShrinking}
          isFindingDigits={isFindingDigits}
          errorMessage={errorMessage}
          onPick={(picked) => void pickPhoto(picked)}
          onRemove={removePhoto}
        />
      </FieldGroup>
      {failureMessage && <ErrorAlert message={failureMessage} />}
      <Button type="submit" disabled={!canSave}>
        Save reading
      </Button>
    </form>
  );
}

export default NewReadingForm;
