import type { ReadingApiModel } from '@app-types/models';
import { ReadingStatusUtil } from '@app-types/utility';
import type { VariantProps } from 'class-variance-authority';
import { Badge, type badgeVariants } from '@components/ui/badge';
import { formatTimestamp } from '@utils/dateUtils';

type Props = {
  reading: ReadingApiModel;
};

type StatusChip = {
  label: string;
  variant: VariantProps<typeof badgeVariants>['variant'];
};

// Always text as well as colour, never colour alone.
const STATUS_CHIPS: Record<ReadingStatusUtil, StatusChip> = {
  [ReadingStatusUtil.NOT_SENT]: { label: 'Not sent', variant: 'outline' },
  [ReadingStatusUtil.SENT]: { label: 'Sent', variant: 'success' },
  [ReadingStatusUtil.FAILED]: { label: 'Failed', variant: 'error' },
};

// Whether the reading's email went out, as a chip, and when it did.
function ReadingSendStatus({ reading }: Props) {
  const { label, variant } = STATUS_CHIPS[reading.status];

  return (
    <span className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
      <Badge variant={variant}>{label}</Badge>
      {reading.sentAt && (
        <>
          {' '}
          <time dateTime={reading.sentAt}>{formatTimestamp(reading.sentAt)}</time>
        </>
      )}
    </span>
  );
}

export default ReadingSendStatus;
