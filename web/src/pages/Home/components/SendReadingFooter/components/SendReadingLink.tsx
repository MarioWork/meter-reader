import { Link, useLocation } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { ReadingApiModel } from '@app-types/models';
import { ReadingStatusUtil } from '@app-types/utility';
import { buttonVariants } from '@components/ui/button';
import { cn } from '@utils/classNameUtils';
import { formatIsoDate } from '@utils/dateUtils';

type Props = {
  reading: ReadingApiModel;
  // The last reading's link is the page's main action; a history card's is a quieter outline button.
  isProminent?: boolean;
};

type SendLinkLabels = {
  // The visible text, and the start of the fuller name screen readers hear (WCAG 2.5.3, label in name).
  text: string;
  ariaPrefix: string;
};

// A sent reading cannot be sent again; a failed one can be tried again.
const SEND_LINK_LABELS: Record<ReadingStatusUtil, SendLinkLabels | null> = {
  [ReadingStatusUtil.NOT_SENT]: { text: 'Send', ariaPrefix: 'Send' },
  [ReadingStatusUtil.FAILED]: { text: 'Try again', ariaPrefix: 'Try again: send' },
  [ReadingStatusUtil.SENT]: null,
};

// Opens the email preview over the history. A link, as it goes somewhere; the history keeps what it has loaded
// behind it.
function SendReadingLink({ reading, isProminent = false }: Props) {
  const { search } = useLocation();
  const labels = SEND_LINK_LABELS[reading.status];

  if (!labels) return null;

  return (
    <Link
      className={cn('w-full', isProminent ? buttonVariants({ size: 'lg' }) : buttonVariants({ variant: 'outline' }))}
      to={{ pathname: READING_ROUTES_PATHS.send(String(reading.id)), search }}
      aria-label={`${labels.ariaPrefix} the reading of ${formatIsoDate(reading.date)}`}
    >
      {labels.text}
    </Link>
  );
}

export default SendReadingLink;
