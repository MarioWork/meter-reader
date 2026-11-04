import type { Control, UseFormRegister } from 'react-hook-form';
import type { UpdateSettings } from '@services/settingsService/settingsService.type';
import { Separator } from '@components/ui/separator';
import EmailAddressesCard from './EmailAddressesCard';
import MessageCard, { type MessageErrors } from './MessageCard';

type Props = {
  from: string | null;
  register: UseFormRegister<UpdateSettings>;
  control: Control<UpdateSettings>;
  toError?: string;
  clientNumberError?: string;
  messageErrors: MessageErrors;
};

// The Email card's fields: Provider, then a line, then Message.
function EmailFields({ from, register, control, toError, clientNumberError, messageErrors }: Props) {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  // The React Compiler would memoize that spread, so the input would stop reaching the form state.
  'use no memo';

  return (
    <div className="flex flex-col gap-6">
      <EmailAddressesCard from={from} register={register} toError={toError} clientNumberError={clientNumberError} />
      <Separator />
      <MessageCard register={register} control={control} errors={messageErrors} />
    </div>
  );
}

export default EmailFields;
