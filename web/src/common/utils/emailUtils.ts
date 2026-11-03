import { string } from 'yup';

// The API's limit: the longest address an email can carry.
export const EMAIL_MAX_LENGTH = 254;
export const INVALID_EMAIL_MESSAGE = 'Type a valid email address, like readings@water-provider.com';

// The provider's address, as the Settings form and the save action both check it.
export const providerEmailSchema = string()
  .trim()
  .required("Type the provider's address")
  .email(INVALID_EMAIL_MESSAGE)
  .max(EMAIL_MAX_LENGTH, `Keep it to ${EMAIL_MAX_LENGTH} characters or fewer`);
