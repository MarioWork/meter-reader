import { SendIcon } from 'lucide-react';
import ErrorAlert from '@components/ErrorAlert';
import ProviderEmailMissingNote from '@components/ProviderEmailMissingNote';
import EmailAddresses from '@components/EmailAddresses';
import { Button } from '@components/ui/button';
import LoadingDigits from '@components/LoadingDigits';
import AddEmailPhoto from './components/AddEmailPhoto';
import EmailAttachment from './components/EmailAttachment';
import EmailTextFields from './components/EmailTextFields';
import MailNotConnectedNote from './components/MailNotConnectedNote';
import ResponsiveDialog from '@components/ResponsiveDialog';
import { useAddEmailPhoto } from './hooks/useAddEmailPhoto';
import { useSendReading } from './hooks/useSendReading';

const DIALOG_TITLE = 'Send this reading?';
const DESCRIPTION = 'Check the email and change anything you like before it goes.';
const SEND_LABEL = 'Send';
const SENDING_LABEL = 'Sending…';
// The footer's Send sits outside the form, so it names the form it submits.
const FORM_ID = 'send-reading-form';

// The email as it will go out, ready to edit: the subject, the message and the photo, which a reading saved without
// one can get here (Add a photo). Send stays off while Hotmail is
// not connected (ADR 0001), and while no provider address is saved (ADR 0003). Open for as long as its route is:
// closing it goes back to the page it opened over.
function SendReadingModal() {
  'use no memo';

  const {
    readingEmail,
    register,
    errors,
    isAttachingPhoto,
    setIsAttachingPhoto,
    isMailConnected,
    hasProviderEmail,
    isSending,
    failureMessage,
    handleOpenChange,
    sendReading,
  } = useSendReading();
  const { addPhoto, isAddingPhoto, photoFailureMessage } = useAddEmailPhoto();

  const canSend = !isSending && !isAddingPhoto && isMailConnected && hasProviderEmail;

  const footer = (
    <Button type="submit" form={FORM_ID} disabled={!canSend}>
      {isSending ? <LoadingDigits /> : <SendIcon aria-hidden="true" />}
      {isSending ? SENDING_LABEL : SEND_LABEL}
    </Button>
  );

  return (
    <ResponsiveDialog
      title={DIALOG_TITLE}
      description={DESCRIPTION}
      isOpen
      onOpenChange={handleOpenChange}
      footer={footer}
    >
      <EmailAddresses from={readingEmail.from} to={readingEmail.to} className="rounded-lg border bg-muted/40 p-3" />
      <form id={FORM_ID} noValidate onSubmit={(event) => void sendReading(event)} className="flex flex-col gap-5">
        <EmailTextFields register={register} errors={errors} isDisabled={isSending} />
        {readingEmail.attachment ? (
          <EmailAttachment
            attachment={readingEmail.attachment}
            isAttachingPhoto={isAttachingPhoto}
            isDisabled={isSending}
            onAttachingPhotoChange={setIsAttachingPhoto}
          />
        ) : (
          <AddEmailPhoto
            isAddingPhoto={isAddingPhoto}
            isDisabled={isSending}
            failureMessage={photoFailureMessage}
            onPhotoPicked={addPhoto}
          />
        )}
      </form>
      {!hasProviderEmail && <ProviderEmailMissingNote />}
      {!isMailConnected && <MailNotConnectedNote />}
      {failureMessage && <ErrorAlert message={failureMessage} />}
    </ResponsiveDialog>
  );
}

export default SendReadingModal;
