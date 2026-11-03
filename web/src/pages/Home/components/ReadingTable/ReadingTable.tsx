import { useId } from 'react';
import type { ReadingApiModel } from '@app-types/models';
import { Table } from '@components/ui/table';
import ReadingTableHeader from './components/ReadingTableHeader';
import ReadingTableBody from './components/ReadingTableBody';

type Props = {
  title: string;
  readings: ReadingApiModel[];
  // Focused after a send or a delete here took focus away (useHistoryFocus).
  ref: React.Ref<HTMLElement>;
};

// A wide screen's history: one titled table, newest first, a row per reading. The table takes its name from the
// title, so a screen reader announces it as "Readings, table".
function ReadingTable({ title, readings, ref }: Props) {
  const titleId = useId();

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      <Table aria-labelledby={titleId}>
        <ReadingTableHeader />
        <ReadingTableBody readings={readings} />
      </Table>
    </section>
  );
}

export default ReadingTable;
