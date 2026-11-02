import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useWatch } from 'react-hook-form';
import { useFetcher } from 'react-router';
import type { ReadingApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import Button from '@components/Button';
import FormAlert from '@components/FormAlert';
import { useFetcherFailure } from '@hooks/useFetcherFailure';
import { todayAsIsoDate } from '@utils/dateUtils';
import { createFormData } from '@utils/formDataUtils';
import { isReadingLower, readingDigitsSchema } from '@utils/readingUtils';
import { SAVE_FAILED_MESSAGE } from '../../newReadingUtils';
import LowerReadingWarning from './components/LowerReadingWarning';
import ReadingDateField from './components/ReadingDateField';
import ReadingDigitsField from './components/ReadingDigitsField';
import { getInitialValues, newReadingFormSchema, toPayload, type NewReadingFormValues } from './newReadingFormUtils';

type Props = {
  lastReading?: ReadingApiModel;
};

const DIGITS_FIELD_ID = 'reading-digits';
const DATE_FIELD_ID = 'reading-date';
const WARNING_ID = 'reading-lower-warning';

// Only digits that would pass are compared: half-typed or invalid input gets its error, not a warning.
function isLowerThanLast(digits: string, lastReading?: ReadingApiModel): boolean {
  if (!lastReading || !readingDigitsSchema.isValidSync(digits)) return false;

  return isReadingLower(digits.trim(), lastReading.digits);
}

function NewReadingForm({ lastReading }: Props) {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so the inputs would stop reaching the form state.
  'use no memo';

  const { register, handleSubmit, formState, control } = useForm<NewReadingFormValues>({
    defaultValues: getInitialValues(),
    resolver: yupResolver(newReadingFormSchema),
  });

  const fetcher = useFetcher<JSONResponseUtil>();

  const onSubmit = handleSubmit((values) =>
    fetcher.submit(createFormData({ reading: toPayload(values) }), { method: HttpVerbsUtil.POST }),
  );

  const digits = useWatch({ control, name: 'digits' });
  const isLower = isLowerThanLast(digits, lastReading);
  const isSaving = fetcher.state !== 'idle';
  const failureMessage = useFetcherFailure(fetcher, SAVE_FAILED_MESSAGE);

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
      <ReadingDigitsField
        id={DIGITS_FIELD_ID}
        error={formState.errors.digits?.message}
        warningId={isLower ? WARNING_ID : undefined}
        {...register('digits')}
      />
      {isLower && lastReading && <LowerReadingWarning id={WARNING_ID} lastReading={lastReading} />}
      <ReadingDateField
        id={DATE_FIELD_ID}
        latestDay={todayAsIsoDate()}
        error={formState.errors.date?.message}
        {...register('date')}
      />
      {failureMessage && <FormAlert message={failureMessage} />}
      <Button type="submit" isDisabled={isSaving}>
        Save reading
      </Button>
    </form>
  );
}

export default NewReadingForm;
