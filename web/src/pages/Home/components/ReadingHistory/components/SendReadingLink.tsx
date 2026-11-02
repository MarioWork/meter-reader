import { useLocation } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { ReadingApiModel } from '@app-types/models';
import { ReadingStatusUtil } from '@app-types/utility';
import TextLink from '@components/TextLink';
import { formatIsoDate } from '@utils/dateUtils';

type Props = {
  reading: ReadingApiModel;
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

// Opens the email preview over the history. A link, as it goes somewhere; the history keeps its page behind it.
function SendReadingLink({ reading }: Props) {
  const { search } = useLocation();
  const labels = SEND_LINK_LABELS[reading.status];

  if (!labels) return null;

  return (
    <TextLink
      to={{ pathname: READING_ROUTES_PATHS.send(String(reading.id)), search }}
      ariaLabel={`${labels.ariaPrefix} the reading of ${formatIsoDate(reading.date)}`}
    >
      {labels.text}
    </TextLink>
  );
}

export default SendReadingLink;
