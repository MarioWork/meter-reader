import { useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import AppearanceCard from './components/AppearanceCard';
import DataBackup from './components/DataBackup';
import SettingsForm from './components/SettingsForm';
import type { loader } from './settingsLoader';

// The app's settings (ADR 0003). One user, so being signed in is the only lock (ADR 0002). A phone gets one narrow
// column of cards. From lg the page widens so the Email card can put its preview beside its fields (see
// SettingsForm). Appearance and Data stay below it either way.
function Settings() {
  const { settings } = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-6 lg:max-w-5xl">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SettingsForm settings={settings} />
      <AppearanceCard />
      <DataBackup />
    </main>
  );
}

export default Settings;
