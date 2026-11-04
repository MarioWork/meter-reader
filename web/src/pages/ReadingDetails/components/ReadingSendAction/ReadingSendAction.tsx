import { RotateCcwIcon, SendIcon, type LucideIcon } from 'lucide-react';
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

type SendAction = {
  label: string;
  Icon: LucideIcon;
};

// The page's one primary action while the provider still waits for the reading: a reading not sent yet is sent, a
// failed one tried again. A sent one can go again from the "⋯" menu instead (docs/GLOSSARY.md: Resend).
const SEND_ACTIONS: Partial<Record<ReadingStatusUtil, SendAction>> = {
  [ReadingStatusUtil.NOT_SENT]: { label: 'Send', Icon: SendIcon },
  [ReadingStatusUtil.FAILED]: { label: 'Retry', Icon: RotateCcwIcon },
};

// Opens the email preview over this page, which it comes back to. A link, as it goes somewhere; its word is its name.
function ReadingSendAction({ className }: Props) {
  const reading = useReading();
  const sendPreview = useToWithSearch(READING_ROUTES_PATHS.detailsSend(String(reading.id)));
  const sendAction = SEND_ACTIONS[reading.status];

  if (!sendAction) return null;

  const { label, Icon } = sendAction;

  return (
    <Link to={sendPreview} className={cn(buttonVariants({ size: 'lg' }), className)}>
      <Icon aria-hidden="true" />
      {label}
    </Link>
  );
}

export default ReadingSendAction;
