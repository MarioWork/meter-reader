import { RefreshCwIcon, RotateCcwIcon, SendIcon, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import { ReadingStatusUtil } from '@app-types/utility';
import { buttonVariants } from '@components/ui/button';
import { useToWithSearch } from '@hooks/useToWithSearch';
import { cn } from '@utils/classNameUtils';
import { useReading } from '../../hooks/useReading';

type Props = {
  className?: string;
};

type ButtonVariant = 'default' | 'outline';

type SendAction = {
  label: string;
  Icon: LucideIcon;
  // Filled while the provider still waits for the reading; quieter once it has it.
  variant: ButtonVariant;
};

// The page's one primary action follows the status: a reading not sent yet is sent, a failed one tried again, and a
// sent one can go again (docs/GLOSSARY.md: Resend).
const SEND_ACTIONS: Record<ReadingStatusUtil, SendAction> = {
  [ReadingStatusUtil.NOT_SENT]: { label: 'Send', Icon: SendIcon, variant: 'default' },
  [ReadingStatusUtil.FAILED]: { label: 'Retry', Icon: RotateCcwIcon, variant: 'default' },
  [ReadingStatusUtil.SENT]: { label: 'Resend', Icon: RefreshCwIcon, variant: 'outline' },
};

// Opens the email preview over this page, which it comes back to. A link, as it goes somewhere; its word is its name.
function ReadingSendAction({ className }: Props) {
  const reading = useReading();
  const sendPreview = useToWithSearch(READING_ROUTES_PATHS.detailsSend(String(reading.id)));
  const { label, Icon, variant } = SEND_ACTIONS[reading.status];

  return (
    <Link to={sendPreview} className={cn(buttonVariants({ variant, size: 'lg' }), className)}>
      <Icon aria-hidden="true" />
      {label}
    </Link>
  );
}

export default ReadingSendAction;
