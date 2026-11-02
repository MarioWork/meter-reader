import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import Button from '@components/Button';
import { Alert, AlertTitle } from '@components/ui/alert';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { useFetcherFailure } from '@hooks/useFetcherFailure';
import { describedByIds } from '@utils/ariaUtils';
import { NEW_PASSWORD_HINT } from '@utils/authUtils';
import { createFormData } from '@utils/formDataUtils';
import { SETUP_FAILED_MESSAGE } from '../../setupUtils';
import { getInitialValues, setupFormSchema, toPayload, type SetupFormValues } from './setupFormUtils';

type Props = {
  code: string;
};

const PASSWORD_FIELD_ID = 'setup-password';
const PASSWORD_HINT_ID = 'setup-password-hint';
const PASSWORD_ERROR_ID = 'setup-password-error';
const PASSKEY_CHECKBOX_ID = 'setup-has-passkey';

function SetupForm({ code }: Props) {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so the inputs would stop reaching the form state.
  'use no memo';

  const { register, handleSubmit, formState } = useForm<SetupFormValues>({
    defaultValues: getInitialValues(),
    resolver: yupResolver(setupFormSchema),
  });

  const fetcher = useFetcher<JSONResponseUtil>();

  const onSubmit = handleSubmit((values) =>
    fetcher.submit(createFormData({ setup: toPayload(code, values) }), { method: HttpVerbsUtil.POST }),
  );

  const isSaving = fetcher.state !== 'idle';
  const failureMessage = useFetcherFailure(fetcher, SETUP_FAILED_MESSAGE);
  const passwordError = formState.errors.password?.message;
  const hasPasswordError = passwordError !== undefined;

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        {/* autocomplete lets password managers save it, and nothing blocks paste (WCAG 2.2 accessible authentication). */}
        <Field data-invalid={hasPasswordError}>
          <FieldLabel htmlFor={PASSWORD_FIELD_ID}>Password (leave empty to use only a passkey)</FieldLabel>
          <Input
            id={PASSWORD_FIELD_ID}
            type="password"
            autoComplete="new-password"
            aria-invalid={hasPasswordError}
            aria-describedby={describedByIds(PASSWORD_HINT_ID, hasPasswordError ? PASSWORD_ERROR_ID : undefined)}
            {...register('password')}
          />
          <FieldDescription id={PASSWORD_HINT_ID}>{NEW_PASSWORD_HINT}</FieldDescription>
          <FieldError id={PASSWORD_ERROR_ID}>{passwordError}</FieldError>
        </Field>
        <div className="flex items-center gap-2">
          <input
            id={PASSKEY_CHECKBOX_ID}
            type="checkbox"
            className="size-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            {...register('hasPasskey')}
          />
          <label htmlFor={PASSKEY_CHECKBOX_ID}>Also add a passkey on this device</label>
        </div>
      </FieldGroup>
      {failureMessage && (
        <Alert variant="destructive">
          <AlertTitle>{failureMessage}</AlertTitle>
        </Alert>
      )}
      <Button type="submit" isDisabled={isSaving}>
        Finish setup
      </Button>
    </form>
  );
}

export default SetupForm;
