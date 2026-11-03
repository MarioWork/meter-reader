import { LogInIcon } from 'lucide-react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import ErrorAlert from '@components/ErrorAlert';
import PasswordInputField from '@components/PasswordInputField';
import { Button } from '@components/ui/button';
import { FieldGroup } from '@components/ui/field';
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

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-3">
      <FieldGroup>
        <PasswordInputField
          id={PASSWORD_FIELD_ID}
          label="Password"
          autoComplete="current-password"
          error={formState.errors.password?.message}
          registration={register('password')}
        />
      </FieldGroup>
      {failureMessage && <ErrorAlert message={failureMessage} />}
      <Button type="submit" size="lg" disabled={isSigningIn}>
        <LogInIcon aria-hidden="true" />
        Sign in
      </Button>
    </form>
  );
}

export default PasswordSignInForm;
