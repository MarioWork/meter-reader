import { HISTORY_CELL_CLASSES } from './historyCellClasses';

const COLUMN_NAMES = ['Date', 'Reading', 'Status'];

function ReadingHistoryHeader() {
  return (
    <tr>
      {COLUMN_NAMES.map((columnName) => (
        <th key={columnName} scope="col" className={HISTORY_CELL_CLASSES}>
          {columnName}
        </th>
      ))}
    </tr>
  );
}

export default ReadingHistoryHeader;
