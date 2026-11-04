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

// In the order CostTableRow fills its cells. The amounts right-aligned, so they line up for the eye to run down.
const COLUMNS: Column[] = [
  { label: 'Date' },
  { label: 'Reading' },
  { label: 'Cost', className: 'text-right' },
  { label: 'Bill' },
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
