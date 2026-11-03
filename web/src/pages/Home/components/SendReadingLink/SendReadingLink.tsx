import { RotateCcwIcon, SendIcon, type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { ReadingApiModel } from '@app-types/models';
import { ReadingStatusUtil } from '@app-types/utility';
import { buttonVariants } from '@components/ui/button';
import { cn } from '@utils/classNameUtils';
import { formatIsoDate } from '@utils/dateUtils';

type Props = {
  reading: ReadingApiModel;
  // The newest reading's link is filled, as the page's main action; a history card's is a quieter soft fill.
  isProminent: boolean;
  // Icon only on a card; with its word beside the icon where there is room (the details' footer).
  hasText?: boolean;
};

type SendLink = {
  // The word beside the icon when there is room for it.
  text: string;
  // The start of the name screen readers hear, and the tooltip on hover.
  label: string;
  Icon: LucideIcon;
};

// A sent reading cannot be sent again; a failed one can be tried again.
const SEND_LINKS: Record<ReadingStatusUtil, SendLink | null> = {
  [ReadingStatusUtil.NOT_SENT]: { text: 'Send', label: 'Send', Icon: SendIcon },
  [ReadingStatusUtil.FAILED]: { text: 'Try again', label: 'Try again: send', Icon: RotateCcwIcon },
  [ReadingStatusUtil.SENT]: null,
};

// Opens the email preview over the history. A link, as it goes somewhere; the history keeps what it has loaded
// behind it. Its name comes from `aria-label`, which starts with any word it shows (WCAG 2.5.3); icon only, it is 36 px
// square, over the 24 px minimum target.
function SendReadingLink({ reading, isProminent, hasText = false }: Props) {
  const { search } = useLocation();
  const sendLink = SEND_LINKS[reading.status];

  if (!sendLink) return null;

  const { text, label, Icon } = sendLink;
  const accessibleName = `${label} the reading of ${formatIsoDate(reading.date)}`;
  const variant = isProminent ? 'default' : 'secondary';
  const size = hasText ? 'default' : 'icon-lg';

  return (
    <Link
      className={cn('relative z-10', buttonVariants({ variant, size }))}
      to={{ pathname: READING_ROUTES_PATHS.send(String(reading.id)), search }}
      aria-label={accessibleName}
      title={accessibleName}
    >
      <Icon aria-hidden="true" />
      {hasText && text}
    </Link>
  );
}

export default SendReadingLink;
