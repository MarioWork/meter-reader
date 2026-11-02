import type { UseFormRegisterReturn } from 'react-hook-form';
import TextField from '@components/TextField';

type Props = UseFormRegisterReturn & {
  id: string;
  label: string;
  autoComplete: 'current-password' | 'new-password';
  hint?: string;
  error?: string;
};

// A labelled password input. The autocomplete hint is required so password managers fill and save it (WCAG 2.2
// accessible authentication).
function PasswordField({ autoComplete, ...fieldProps }: Props) {
  return <TextField type="password" autoComplete={autoComplete} {...fieldProps} />;
}

export default PasswordField;
