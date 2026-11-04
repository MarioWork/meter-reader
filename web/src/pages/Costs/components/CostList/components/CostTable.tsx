import type { ReadingApiModel } from '@app-types/models';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { cn } from '@utils/classNameUtils';
import CostTableRow from './CostTableRow';

type Props = {
  readings: ReadingApiModel[];
  // The card's title, which names the table.
  titleId: string;
};

type Column = {
  label: string;
  className?: string;
};

// In the order CostTableRow fills its cells, each with room around what it holds. All start-aligned, so a row reads
// left to right like the rest of the page.
const COLUMNS: Column[] = [
  { label: 'Date', className: 'w-40' },
  { label: 'Reading', className: 'w-36' },
  { label: 'Cost', className: 'w-36' },
  // Wide enough for most file names before they are cut short.
  { label: 'Bill', className: 'w-64' },
];

// A wide screen's list: a compact table, a row per reading, each column only as wide as what it holds, so a row reads
// from its date to its bill in one glance instead of across the whole screen.
function CostTable({ readings, titleId }: Props) {
  return (
    <Table aria-labelledby={titleId} className="w-auto min-w-md">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {COLUMNS.map(({ label, className }) => (
            <TableHead key={label} scope="col" className={cn('px-3', className)}>
              {label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {readings.map((reading) => (
          <CostTableRow key={reading.id} reading={reading} />
        ))}
      </TableBody>
    </Table>
  );
}

export default CostTable;
