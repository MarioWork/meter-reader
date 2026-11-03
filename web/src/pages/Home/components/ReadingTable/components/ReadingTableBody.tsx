import type { ReadingApiModel } from '@app-types/models';
import { TableBody } from '@components/ui/table';
import ReadingTableRow from './ReadingTableRow';

type Props = {
  readings: ReadingApiModel[];
};

// A row per reading, newest first, as the API ordered them.
function ReadingTableBody({ readings }: Props) {
  return (
    <TableBody>
      {readings.map((reading) => (
        <ReadingTableRow key={reading.id} reading={reading} />
      ))}
    </TableBody>
  );
}

export default ReadingTableBody;
