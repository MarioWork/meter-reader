export type SettingsErrorMockModel = { code: string; message: string };

// The API's error envelope when a send is asked for before the provider's address is saved.
export const createProviderEmailNotSetMockModel = (): SettingsErrorMockModel => ({
  code: 'PROVIDER_EMAIL_NOT_SET',
  message: "Set the provider's address in Settings.",
});
