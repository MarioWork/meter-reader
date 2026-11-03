import { TableHead, TableHeader, TableRow } from '@components/ui/table';
import { cn } from '@utils/classNameUtils';

type Column = {
  label: string;
  className?: string;
  // Heard, not seen: the column's cells speak for themselves.
  isLabelHidden?: boolean;
};

// In the order ReadingTableRow fills its cells.
const COLUMNS: Column[] = [
  { label: 'Date' },
  { label: 'Reading' },
  { label: 'Status' },
  { label: 'Cost', className: 'text-right' },
  { label: 'Bill' },
  { label: 'Actions', isLabelHidden: true },
];

// The table's header row: one column header per column, so a screen reader names each cell by its column.
function ReadingTableHeader() {
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        {COLUMNS.map(({ label, className, isLabelHidden = false }) => (
          <TableHead key={label} scope="col" className={className}>
            <span className={cn(isLabelHidden && 'sr-only')}>{label}</span>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

export default ReadingTableHeader;
