import ReadingSendStatus from '@components/ReadingSendStatus';
import BackToReadingsLink from '../../BackToReadingsLink';
import { cn } from '@utils/classNameUtils';
import { formatIsoDate } from '@utils/dateUtils';
import { useReading } from '../../../hooks/useReading';

type Props = {
  // Beside the title where there is room (a wide screen); under it on a phone.
  isStatusBeside?: boolean;
};

const TITLE_PREFIX = 'Reading of';

// The page's one heading, the day it was read, with the way back to the readings as a chevron on its left and its
// status chip: text as well as colour.
function ReadingTitle({ isStatusBeside = false }: Props) {
  const reading = useReading();

  return (
    <div className="flex min-w-0 items-start gap-1">
      <BackToReadingsLink isIcon />
      <div className={cn('flex flex-col gap-2', isStatusBeside && 'flex-row flex-wrap items-center gap-x-3')}>
        <h1 className="text-lg/9 font-bold sm:text-2xl/9">
          {TITLE_PREFIX} {formatIsoDate(reading.date)}
        </h1>
        <ReadingSendStatus reading={reading} />
      </div>
    </div>
  );
}

export default ReadingTitle;
