import { HISTORY_CELL_CLASSES } from './historyCellClasses';

const COLUMN_NAMES = ['Date', 'Reading', 'Status', 'Photo'];

function ReadingHistoryHeader() {
  return (
    <tr>
      {COLUMN_NAMES.map((columnName) => (
        <th key={columnName} scope="col" className={HISTORY_CELL_CLASSES}>
          {columnName}
        </th>
      ))}
      <th scope="col" className={HISTORY_CELL_CLASSES}>
        <span className="sr-only">Actions</span>
      </th>
    </tr>
  );
}

export default ReadingHistoryHeader;
