import settingsService from '@services/settingsService/settingsService';

export async function loader() {
  const settings = await settingsService.getSettings();

  return { settings };
}
