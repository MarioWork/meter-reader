import { object, type InferType } from 'yup';
import type { PasswordSignIn } from '@services/authService/authService.type';
import { passwordSchema } from '@utils/authUtils';

export const passwordSignInFormSchema = object({
  password: passwordSchema,
});

export type PasswordSignInFormValues = InferType<typeof passwordSignInFormSchema>;

export const getInitialValues = (): PasswordSignInFormValues => ({ password: '' });

export const toPayload = (values: PasswordSignInFormValues): PasswordSignIn => ({ password: values.password });
