import ErrorAlert from '@components/ErrorAlert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';
import EmailPreview from './components/EmailPreview';
import { useSendReading } from './hooks/useSendReading';

const DIALOG_TITLE = 'Send this reading?';
const SEND_LABEL = 'Send';
const SENDING_LABEL = 'Sending…';
const MAIL_NOT_CONNECTED_TEXT = "Hotmail is not connected, so the reading can't be sent. Run";
const MAIL_NOT_CONNECTED_COMMAND = 'yarn mail:connect';
const MAIL_NOT_CONNECTED_END = 'on the server first.';

// The email exactly as it will go out, and Send. Send stays off while Hotmail is not connected (ADR 0001). Open for
// as long as its route is: closing it goes back to the history.
function SendReadingModal() {
  const {
    readingEmail,
    isAttachingPhoto,
    setIsAttachingPhoto,
    isMailConnected,
    isSending,
    failureMessage,
    handleOpenChange,
    sendReading,
  } = useSendReading();

  return (
    <AlertDialog open onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
        <AlertDialogTitle>{DIALOG_TITLE}</AlertDialogTitle>
        <EmailPreview
          email={readingEmail}
          isAttachingPhoto={isAttachingPhoto}
          isDisabled={isSending}
          onAttachingPhotoChange={setIsAttachingPhoto}
        />
        {!isMailConnected && (
          <p className="text-warning">
            {MAIL_NOT_CONNECTED_TEXT} <code className="font-mono">{MAIL_NOT_CONNECTED_COMMAND}</code>{' '}
            {MAIL_NOT_CONNECTED_END}
          </p>
        )}
        {failureMessage && <ErrorAlert message={failureMessage} />}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isSending || !isMailConnected} onClick={sendReading}>
            {isSending ? SENDING_LABEL : SEND_LABEL}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default SendReadingModal;
