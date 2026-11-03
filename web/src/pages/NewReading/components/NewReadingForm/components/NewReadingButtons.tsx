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

// Cancel, Save reading (the form's submit, so Enter saves) and Send reading, which saves and sends in one go.
function NewReadingButtons({ isDisabled, isSendDisabled, onSend }: Props) {
  const { search } = useLocation();

  return (
    <div className="flex gap-3">
      {/* Goes somewhere, so a link: back to the same page of the history, which also closes the modal. */}
      <Link
        to={{ pathname: BASE_ROUTES_PATHS.HOME, search }}
        className={buttonVariants({ variant: 'ghost', size: 'lg' })}
      >
        Cancel
      </Link>
      <Button type="submit" variant="outline" size="lg" disabled={isDisabled} className="flex-1">
        <SaveIcon aria-hidden="true" />
        Save reading
      </Button>
      <Button type="button" size="lg" disabled={isDisabled || isSendDisabled} className="flex-1" onClick={onSend}>
        <SendIcon aria-hidden="true" />
        Send reading
      </Button>
    </div>
  );
}

export default NewReadingButtons;
