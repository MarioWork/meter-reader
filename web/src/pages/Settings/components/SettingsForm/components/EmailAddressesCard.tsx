import type { UseFormRegister } from 'react-hook-form';
import type { UpdateSettings } from '@services/settingsService/settingsService.type';
import { FieldGroup } from '@components/ui/field';
import SettingsCard from '../../SettingsCard';
import FromAddress from './FromAddress';
import ToAddressField from './ToAddressField';

type Props = {
  from: string | null;
  register: UseFormRegister<UpdateSettings>;
  toError?: string;
};

const TITLE = 'Email addresses';
const DESCRIPTION = 'Who every reading is emailed to, and who it comes from.';

// To, the one address typed here, then From, which the server sets.
function EmailAddressesCard({ from, register, toError }: Props) {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so the input would stop reaching the form state.
  'use no memo';

  return (
    <SettingsCard title={TITLE} description={DESCRIPTION}>
      <FieldGroup className="gap-4">
        <ToAddressField error={toError} registration={register('to')} />
        <FromAddress from={from} />
      </FieldGroup>
    </SettingsCard>
  );
}

export default EmailAddressesCard;
