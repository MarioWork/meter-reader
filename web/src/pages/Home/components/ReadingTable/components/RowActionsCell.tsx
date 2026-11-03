import type { ReadingApiModel } from '@app-types/models';
import { TableCell } from '@components/ui/table';
import { cn } from '@utils/classNameUtils';
import ReadingActionsMenu from '../../ReadingActionsMenu';
import SendReadingLink from '../../SendReadingLink';
import { ABOVE_DETAILS_LINK } from '../readingTableUtils';

type Props = {
  reading: ReadingApiModel;
};

// The end of a row: Send or Try again while the reading can still go, then its "⋯" menu.
function RowActionsCell({ reading }: Props) {
  return (
    <TableCell className={cn(ABOVE_DETAILS_LINK, 'space-x-1 text-right')}>
      <SendReadingLink reading={reading} isProminent={false} />
      <ReadingActionsMenu reading={reading} />
    </TableCell>
  );
}

export default RowActionsCell;
