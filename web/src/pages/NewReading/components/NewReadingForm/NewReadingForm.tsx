import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useWatch } from 'react-hook-form';
import { useFetcher } from 'react-router';
import type { ReadingApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import Button from '@components/Button';
import FormAlert from '@components/FormAlert';
import TextField from '@components/TextField';
import { useFetcherFailure } from '@hooks/useFetcherFailure';
import { todayAsIsoDate } from '@utils/dateUtils';
import { createFormData } from '@utils/formDataUtils';
import { isReadingLower, readingDigitsSchema } from '@utils/readingUtils';
import { SAVE_FAILED_MESSAGE } from '../../newReadingUtils';
import LowerReadingWarning from './components/LowerReadingWarning';
import PhotoDigitsStatus from './components/PhotoDigitsStatus';
import PhotoPicker from './components/PhotoPicker';
import { usePhotoDigits } from './hooks/usePhotoDigits';
import { usePhotoPicker } from './hooks/usePhotoPicker';
import { getInitialValues, newReadingFormSchema, toPayload, type NewReadingFormValues } from './newReadingFormUtils';

type Props = {
  lastReading?: ReadingApiModel;
};

const DIGITS_FIELD_ID = 'reading-digits';
const DATE_FIELD_ID = 'reading-date';
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

  const { register, handleSubmit, formState, control, setValue } = useForm<NewReadingFormValues>({
    defaultValues: getInitialValues(),
    resolver: yupResolver(newReadingFormSchema),
  });

  const fetcher = useFetcher<JSONResponseUtil>();
  const { photo, previewUrl, isShrinking, errorMessage, pickPhoto, removePhoto } = usePhotoPicker();
  // Filled in as if typed, so the digits are checked and compared with the last reading the same way.
  const { isReading, hasFoundNothing, readDigits, forgetDigits } = usePhotoDigits((found) =>
    setValue('digits', found, { shouldDirty: true, shouldValidate: formState.isSubmitted }),
  );

  async function handlePick(picked: File) {
    const shrunk = await pickPhoto(picked);

    if (shrunk) await readDigits(shrunk);
  }

  function handleRemove() {
    removePhoto();
    forgetDigits();
  }

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
      {/* Text, not a number input: a number input drops leading zeros. inputMode still opens the digit keypad. */}
      <TextField
        id={DIGITS_FIELD_ID}
        label="Reading"
        inputMode="numeric"
        autoComplete="off"
        error={formState.errors.digits?.message}
        describedById={isLower ? WARNING_ID : undefined}
        {...register('digits')}
      />
      {isLower && lastReading && <LowerReadingWarning id={WARNING_ID} lastReading={lastReading} />}
      <PhotoDigitsStatus isReading={isReading} hasFoundNothing={hasFoundNothing} />
      <TextField
        id={DATE_FIELD_ID}
        label="Date"
        type="date"
        latestDate={todayAsIsoDate()}
        error={formState.errors.date?.message}
        {...register('date')}
      />
      <PhotoPicker
        previewUrl={previewUrl}
        isBusy={isShrinking || isReading}
        isShrinking={isShrinking}
        errorMessage={errorMessage}
        onPick={(picked) => void handlePick(picked)}
        onRemove={handleRemove}
      />
      {failureMessage && <FormAlert message={failureMessage} />}
      <Button type="submit" isDisabled={!canSave}>
        Save reading
      </Button>
    </form>
  );
}

export default NewReadingForm;
