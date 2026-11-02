import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import Button from '@components/Button';
import FormAlert from '@components/FormAlert';
import PasswordField from '@components/PasswordField';
import { createFormData } from '@utils/formDataUtils';
import { LoginIntents, SIGN_IN_FAILED_MESSAGE } from '../../loginUtils';
import {
  getInitialValues,
  passwordSignInFormSchema,
  toPayload,
  type PasswordSignInFormValues,
} from './passwordSignInFormUtils';

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
  const failure = fetcher.data?.success === false ? fetcher.data.error : undefined;
  const hasFailed = fetcher.data?.success === false && !isSigningIn;

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-3">
      <PasswordField
        id="sign-in-password"
        label="Password"
        autoComplete="current-password"
        error={formState.errors.password?.message}
        {...register('password')}
      />
      {hasFailed && <FormAlert message={failure?.message ?? SIGN_IN_FAILED_MESSAGE} />}
      <Button type="submit" isDisabled={isSigningIn}>
        Sign in
      </Button>
    </form>
  );
}

export default PasswordSignInForm;
