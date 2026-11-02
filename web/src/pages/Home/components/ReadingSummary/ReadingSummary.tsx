import type { ReadingApiModel } from '@app-types/models';
import { CardContent } from '@components/ui/card';
import { cn } from '@utils/classNameUtils';
import ReadingSendStatus from '../ReadingSendStatus';

type Props = {
  reading: ReadingApiModel;
  // The last reading's digits are big and stacked above its status; a history card keeps them on one line.
  isProminent?: boolean;
};

type SummaryClasses = {
  content: string;
  digits: string;
};

const PROMINENT_CLASSES: SummaryClasses = {
  content: 'flex flex-col items-start gap-3',
  digits: 'text-5xl font-semibold tracking-wider',
};

const COMPACT_CLASSES: SummaryClasses = {
  content: 'flex flex-wrap items-center justify-between gap-2',
  digits: 'text-2xl',
};

const NO_PHOTO_LABEL = 'No photo';

// A reading card's body: the digits exactly as read, whether it was sent, and a note when it has no photo to send.
function ReadingSummary({ reading, isProminent = false }: Props) {
  const classes = isProminent ? PROMINENT_CLASSES : COMPACT_CLASSES;
  const hasPhoto = reading.photoId !== null;

  return (
    <CardContent className={classes.content}>
      <p className={cn('font-mono tabular-nums', classes.digits)}>{reading.digits}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <ReadingSendStatus reading={reading} />
        {!hasPhoto && <span className="text-sm text-muted-foreground">{NO_PHOTO_LABEL}</span>}
      </div>
    </CardContent>
  );
}

export default ReadingSummary;
