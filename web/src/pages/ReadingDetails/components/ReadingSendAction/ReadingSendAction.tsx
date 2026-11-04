import { RotateCcwIcon, SendIcon, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import { ReadingStatusUtil } from '@app-types/utility';
import { buttonVariants } from '@components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';
import { useToWithSearch } from '@hooks/useToWithSearch';
import { cn } from '@utils/classNameUtils';
import { useReading } from '../../hooks/useReading';

type Props = {
  className?: string;
  // The word beside the icon, where the button stands on its own line (the email card).
  hasText?: boolean;
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

// Opens the email preview over this page, which it comes back to. A link, as it goes somewhere. Icon only, its label
// is its name and shows as a tooltip on hover and on keyboard focus; 36 px square, over the 24 px minimum target.
function ReadingSendAction({ className, hasText = false }: Props) {
  const reading = useReading();
  const sendPreview = useToWithSearch(READING_ROUTES_PATHS.detailsSend(String(reading.id)));
  const sendAction = SEND_ACTIONS[reading.status];

  if (!sendAction) return null;

  const { label, Icon } = sendAction;

  if (hasText) {
    return (
      <Link to={sendPreview} className={cn(buttonVariants(), className)}>
        <Icon data-icon="inline-start" aria-hidden="true" />
        {label}
      </Link>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link to={sendPreview} aria-label={label} className={cn(buttonVariants({ size: 'icon-lg' }), className)} />
        }
      >
        <Icon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export default ReadingSendAction;
