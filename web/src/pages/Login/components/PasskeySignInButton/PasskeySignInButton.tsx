import { useFetcher } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import Button from '@components/Button';
import { Alert, AlertTitle } from '@components/ui/alert';
import { useFetcherFailure } from '@hooks/useFetcherFailure';
import { createFormData } from '@utils/formDataUtils';
import { LoginIntents, SIGN_IN_FAILED_MESSAGE } from '../../loginUtils';

// One button: the click submits to the login action, which runs the whole passkey sign-in, the prompt included.
function PasskeySignInButton() {
  const fetcher = useFetcher<JSONResponseUtil>();
  const isSigningIn = fetcher.state !== 'idle';
  const failureMessage = useFetcherFailure(fetcher, SIGN_IN_FAILED_MESSAGE);

  const signIn = () =>
    void fetcher.submit(createFormData({ intent: LoginIntents.PASSKEY }), { method: HttpVerbsUtil.POST });

  return (
    <div className="flex flex-col gap-3">
      <Button variant="secondary" isDisabled={isSigningIn} onClick={signIn}>
        Sign in with a passkey
      </Button>
      {failureMessage && (
        <Alert variant="destructive">
          <AlertTitle>{failureMessage}</AlertTitle>
        </Alert>
      )}
    </div>
  );
}

export default PasskeySignInButton;
