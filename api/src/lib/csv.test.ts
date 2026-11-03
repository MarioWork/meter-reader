import { toCsv, type CsvColumn } from './csv.ts';

type Row = { name: string | null; count: number; isDone: boolean };

const COLUMNS: CsvColumn<Row>[] = [
  { header: 'name', valueOf: (row) => row.name },
  { header: 'count', valueOf: (row) => row.count },
  { header: 'is_done', valueOf: (row) => row.isDone },
];

describe('toCsv', () => {
  it('writes the header and one CRLF-ended line per row when rows are given', () => {
    const csv = toCsv([{ name: 'first', count: 2, isDone: true }], COLUMNS);

    expect(csv).toBe('name,count,is_done\r\nfirst,2,true\r\n');
  });

  it('writes only the header when there are no rows', () => {
    expect(toCsv([], COLUMNS)).toBe('name,count,is_done\r\n');
  });

  it('writes an empty cell when the value is null', () => {
    const csv = toCsv([{ name: null, count: 0, isDone: false }], COLUMNS);

    expect(csv).toBe('name,count,is_done\r\n,0,false\r\n');
  });

  it('keeps text exactly as it is when it is made of digits with leading zeros', () => {
    const csv = toCsv([{ name: '00123', count: 1, isDone: false }], COLUMNS);

    expect(csv).toContain('\r\n00123,1,false\r\n');
  });

  it('quotes a cell and doubles its quotes when it holds a separator, a quote or a line break', () => {
    const csv = toCsv([{ name: 'Date: 3 November\nReading: "00123", ok', count: 1, isDone: false }], COLUMNS);

    expect(csv).toContain('"Date: 3 November\nReading: ""00123"", ok",1,false');
  });

  it.each(['=SUM(A1)', '+1', '-1', '@cmd', '\tx'])(
    'defuses %j with a leading apostrophe when text starts like a formula',
    (name) => {
      const csv = toCsv([{ name, count: 1, isDone: false }], COLUMNS);

      expect(csv).toBe(`name,count,is_done\r\n'${name},1,false\r\n`);
    },
  );
});
