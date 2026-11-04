import type { UseFormRegister } from 'react-hook-form';
import type { UpdateSettings } from '@services/settingsService/settingsService.type';
import { FieldGroup } from '@components/ui/field';
import SettingsSection from '../../SettingsSection';
import FromAddress from './FromAddress';
import ClientNumberField from './ClientNumberField';
import ToAddressField from './ToAddressField';

type Props = {
  from: string | null;
  register: UseFormRegister<UpdateSettings>;
  toError?: string;
  clientNumberError?: string;
};

const TITLE = 'Provider';
const DESCRIPTION = 'Where every reading is emailed, your client number there, and who it comes from.';

// To, the one address typed here, the client number, then From, which the server sets.
function EmailAddressesCard({ from, register, toError, clientNumberError }: Props) {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so the input would stop reaching the form state.
  'use no memo';

  return (
    <SettingsSection title={TITLE} description={DESCRIPTION}>
      <FieldGroup className="gap-4">
        <ToAddressField error={toError} registration={register('to')} />
        <ClientNumberField error={clientNumberError} registration={register('clientNumber')} />
        <FromAddress from={from} />
      </FieldGroup>
    </SettingsSection>
  );
}

export default EmailAddressesCard;
