import ReadingSendStatus from '@components/ReadingSendStatus';
import { cn } from '@utils/classNameUtils';
import { formatIsoDate } from '@utils/dateUtils';
import { useReading } from '../../../hooks/useReading';

type Props = {
  // Beside the title where there is room (a wide screen); under it on a phone.
  isStatusBeside?: boolean;
};

const TITLE_PREFIX = 'Reading of';

// The page's one heading, the day it was read, with its status chip: text as well as colour.
function ReadingTitle({ isStatusBeside = false }: Props) {
  const reading = useReading();
  return (
    <div className={cn('flex flex-col gap-2', isStatusBeside && 'flex-row flex-wrap items-center gap-x-3')}>
      <h1 className="text-2xl font-bold">
        {TITLE_PREFIX} {formatIsoDate(reading.date)}
      </h1>
      <ReadingSendStatus reading={reading} />
    </div>
  );
}

export default ReadingTitle;
