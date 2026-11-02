import { useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import SetupForm from './components/SetupForm';
import { loader } from './setupLoader';

function Setup() {
  const { code } = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Set up the login</h1>
      {code ? (
        <>
          <p>Choose how you sign in: a password, a passkey (Face ID, Touch ID or a passkey manager), or both.</p>
          <SetupForm code={code} />
        </>
      ) : (
        <p>Open the setup link the server printed in its log. It looks like /setup?code=…</p>
      )}
    </main>
  );
}

export default Setup;
