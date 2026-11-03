import { useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { Card, CardContent } from '@components/ui/card';
import SettingsForm from './components/SettingsForm';
import type { loader } from './settingsLoader';

// The app's settings (ADR 0003). One user, so being signed in is the only lock (ADR 0002).
function Settings() {
  const { settings } = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card>
        <CardContent>
          <SettingsForm settings={settings} />
        </CardContent>
      </Card>
    </main>
  );
}

export default Settings;
