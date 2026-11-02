import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import Button from '@components/Button';
import { Alert, AlertTitle } from '@components/ui/alert';
import { Field, FieldError, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { useFetcherFailure } from '@hooks/useFetcherFailure';
import { createFormData } from '@utils/formDataUtils';
import { LoginIntents, SIGN_IN_FAILED_MESSAGE } from '../../loginUtils';
import {
  getInitialValues,
  passwordSignInFormSchema,
  toPayload,
  type PasswordSignInFormValues,
} from './passwordSignInFormUtils';

const PASSWORD_FIELD_ID = 'sign-in-password';
const PASSWORD_ERROR_ID = 'sign-in-password-error';

function PasswordSignInForm() {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so the input would stop reaching the form state.
  'use no memo';

  const { register, handleSubmit, formState } = useForm<PasswordSignInFormValues>({
    defaultValues: getInitialValues(),
    resolver: yupResolver(passwordSignInFormSchema),
  });

  const fetcher = useFetcher<JSONResponseUtil>();

  const onSubmit = handleSubmit((values) =>
    fetcher.submit(createFormData({ intent: LoginIntents.PASSWORD, credentials: toPayload(values) }), {
      method: HttpVerbsUtil.POST,
    }),
  );

  const isSigningIn = fetcher.state !== 'idle';
  const failureMessage = useFetcherFailure(fetcher, SIGN_IN_FAILED_MESSAGE);
  const passwordError = formState.errors.password?.message;
  const hasPasswordError = passwordError !== undefined;

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-3">
      <FieldGroup>
        {/* autocomplete lets password managers fill it, and nothing blocks paste (WCAG 2.2 accessible authentication). */}
        <Field data-invalid={hasPasswordError}>
          <FieldLabel htmlFor={PASSWORD_FIELD_ID}>Password</FieldLabel>
          <Input
            id={PASSWORD_FIELD_ID}
            type="password"
            autoComplete="current-password"
            aria-invalid={hasPasswordError}
            aria-describedby={hasPasswordError ? PASSWORD_ERROR_ID : undefined}
            {...register('password')}
          />
          <FieldError id={PASSWORD_ERROR_ID}>{passwordError}</FieldError>
        </Field>
      </FieldGroup>
      {failureMessage && (
        <Alert variant="destructive">
          <AlertTitle>{failureMessage}</AlertTitle>
        </Alert>
      )}
      <Button type="submit" isDisabled={isSigningIn}>
        Sign in
      </Button>
    </form>
  );
}

export default PasswordSignInForm;
