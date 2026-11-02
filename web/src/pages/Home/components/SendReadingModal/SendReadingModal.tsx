import ConfirmDialog from '@components/ConfirmDialog';
import FormAlert from '@components/FormAlert';
import EmailPreview from './components/EmailPreview';
import { useSendReading } from './hooks/useSendReading';

const DIALOG_TITLE = 'Send this reading?';
const SEND_LABEL = 'Send';
const SENDING_LABEL = 'Sending…';

// The email exactly as it will go out, and Send. Send stays off while Hotmail is not connected (ADR 0001).
function SendReadingModal() {
  const {
    readingEmail,
    isAttachingPhoto,
    setIsAttachingPhoto,
    isMailConnected,
    isSending,
    failureMessage,
    closePreview,
    sendReading,
  } = useSendReading();

  return (
    <ConfirmDialog
      isOpen
      title={DIALOG_TITLE}
      confirmLabel={isSending ? SENDING_LABEL : SEND_LABEL}
      isConfirming={isSending}
      isConfirmDisabled={!isMailConnected}
      onConfirm={sendReading}
      onCancel={closePreview}
    >
      <EmailPreview
        email={readingEmail}
        isAttachingPhoto={isAttachingPhoto}
        isDisabled={isSending}
        onAttachingPhotoChange={setIsAttachingPhoto}
      />
      {!isMailConnected && (
        <p className="text-amber-900">
          Hotmail is not connected, so the reading can&apos;t be sent. Run{' '}
          <code className="font-mono">yarn mail:connect</code> on the server first.
        </p>
      )}
      {failureMessage && <FormAlert message={failureMessage} />}
    </ConfirmDialog>
  );
}

export default SendReadingModal;
