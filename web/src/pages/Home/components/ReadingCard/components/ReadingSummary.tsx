import type { ReadingApiModel } from '@app-types/models';
import { CardContent } from '@components/ui/card';
import { cn } from '@utils/classNameUtils';
import SendReadingLink from './SendReadingLink';

type Props = {
  reading: ReadingApiModel;
  isProminent: boolean;
};

const PROMINENT_DIGITS = 'text-5xl font-semibold tracking-wider';
const COMPACT_DIGITS = 'text-2xl';

// A reading card's body: the digits exactly as read on the left, and Send or Try again at the bottom right while
// it can still go.
function ReadingSummary({ reading, isProminent }: Props) {
  return (
    <CardContent className="flex items-end justify-between gap-3">
      <p className={cn('font-mono tabular-nums', isProminent ? PROMINENT_DIGITS : COMPACT_DIGITS)}>{reading.digits}</p>
      <SendReadingLink reading={reading} isProminent={isProminent} />
    </CardContent>
  );
}

export default ReadingSummary;
