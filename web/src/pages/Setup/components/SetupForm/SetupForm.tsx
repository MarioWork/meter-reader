import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import Button from '@components/Button';
import FormAlert from '@components/FormAlert';
import PasswordField from '@components/PasswordField';
import { useFetcherFailure } from '@hooks/useFetcherFailure';
import { NEW_PASSWORD_HINT } from '@utils/authUtils';
import { createFormData } from '@utils/formDataUtils';
import { SETUP_FAILED_MESSAGE } from '../../setupUtils';
import { getInitialValues, setupFormSchema, toPayload, type SetupFormValues } from './setupFormUtils';

type Props = {
  code: string;
};

const PASSWORD_FIELD_ID = 'setup-password';
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

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
      <PasswordField
        id={PASSWORD_FIELD_ID}
        label="Password (leave empty to use only a passkey)"
        autoComplete="new-password"
        hint={NEW_PASSWORD_HINT}
        error={formState.errors.password?.message}
        {...register('password')}
      />
      <div className="flex items-center gap-2">
        <input
          id={PASSKEY_CHECKBOX_ID}
          type="checkbox"
          className="size-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          {...register('hasPasskey')}
        />
        <label htmlFor={PASSKEY_CHECKBOX_ID}>Also add a passkey on this device</label>
      </div>
      {failureMessage && <FormAlert message={failureMessage} />}
      <Button type="submit" isDisabled={isSaving}>
        Finish setup
      </Button>
    </form>
  );
}

export default SetupForm;
