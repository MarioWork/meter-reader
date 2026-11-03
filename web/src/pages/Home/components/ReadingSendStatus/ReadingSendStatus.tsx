import type { ReadingApiModel } from '@app-types/models';
import { ReadingStatusUtil } from '@app-types/utility';
import type { VariantProps } from 'class-variance-authority';
import { Badge, type badgeVariants } from '@components/ui/badge';
import { formatTimestamp } from '@utils/dateUtils';
import { READING_STATUS_LABELS } from '../../readingStatusLabels';

type Props = {
  reading: ReadingApiModel;
};

type StatusChipVariant = VariantProps<typeof badgeVariants>['variant'];

// Always text as well as colour, never colour alone.
const STATUS_CHIP_VARIANTS: Record<ReadingStatusUtil, StatusChipVariant> = {
  [ReadingStatusUtil.NOT_SENT]: 'warning',
  [ReadingStatusUtil.SENT]: 'success',
  [ReadingStatusUtil.FAILED]: 'error',
};

// Whether the reading's email went out, as a chip, and when it did.
function ReadingSendStatus({ reading }: Props) {
  const label = READING_STATUS_LABELS[reading.status];
  const variant = STATUS_CHIP_VARIANTS[reading.status];

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
