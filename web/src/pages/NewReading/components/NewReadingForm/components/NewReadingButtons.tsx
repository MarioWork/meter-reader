import { SaveIcon, SendIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { Button, buttonVariants } from '@components/ui/button';

type Props = {
  isDisabled: boolean;
  // Off on its own while the email has nowhere to go: Save still works.
  isSendDisabled: boolean;
  onSend: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

const CANCEL_LABEL = 'Cancel';
const SAVE_LABEL = 'Save';
const SEND_LABEL = 'Send';

// Cancel, Save (the form's submit, so Enter saves) and Send, which saves and sends in one go. Each as wide as its
// icon and word, together at the end of the form, where the eye ends up after filling it in.
function NewReadingButtons({ isDisabled, isSendDisabled, onSend }: Props) {
  const { search } = useLocation();

  return (
    <div className="flex justify-end gap-3">
      {/* Goes somewhere, so a link: back to the same page of the history, which also closes the modal. */}
      <Link
        to={{ pathname: BASE_ROUTES_PATHS.HOME, search }}
        className={buttonVariants({ variant: 'ghost', size: 'lg' })}
      >
        {CANCEL_LABEL}
      </Link>
      <Button type="submit" variant="outline" size="lg" disabled={isDisabled}>
        <SaveIcon aria-hidden="true" />
        {SAVE_LABEL}
      </Button>
      <Button type="button" size="lg" disabled={isDisabled || isSendDisabled} onClick={onSend}>
        <SendIcon aria-hidden="true" />
        {SEND_LABEL}
      </Button>
    </div>
  );
}

export default NewReadingButtons;
