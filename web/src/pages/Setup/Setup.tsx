import { useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import StandalonePage from '@components/StandalonePage';
import SetupForm from './components/SetupForm';
import { loader } from './setupLoader';

const TITLE = 'Set up the login';
const CHOOSE_HINT = 'Choose how you sign in: a password, a passkey (Face ID, Touch ID or a passkey manager), or both.';
const MISSING_CODE_HINT = 'Open the setup link the server printed in its log. It looks like /setup?code=…';

function Setup() {
  const { code } = useLoaderData<LoaderDataUtil<typeof loader>>();

  if (!code) return <StandalonePage title={TITLE} description={MISSING_CODE_HINT} />;

  return (
    <StandalonePage title={TITLE} description={CHOOSE_HINT}>
      <SetupForm code={code} />
    </StandalonePage>
  );
}

export default Setup;
