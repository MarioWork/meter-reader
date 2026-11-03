import { readSheet } from 'read-excel-file/node';
import { sheetFormulas, sheetLinks } from './spreadsheet.fixture.ts';
import { toSpreadsheet, toSpreadsheetTime, type SpreadsheetColumn } from './spreadsheet.ts';

type Meter = { serial: string; litres: number; installedOn: Date; note: string | null };

const COLUMNS: SpreadsheetColumn<Meter>[] = [
  { title: 'Serial', width: 10, valueOf: (meter) => meter.serial },
  { title: 'Litres', width: 8, valueOf: (meter) => meter.litres },
  { title: 'Installed', width: 12, valueOf: (meter) => meter.installedOn, format: 'yyyy-mm-dd' },
  { title: 'Note', width: 20, valueOf: (meter) => meter.note },
];
const HEADER = ['Serial', 'Litres', 'Installed', 'Note'];

const INSTALLED_ON = new Date('2026-03-01T00:00:00.000Z');

describe('toSpreadsheet', () => {
  it('writes the header, then one row of typed cells per item in order, when given items', async () => {
    const items = [
      { serial: '00123', litres: 412, installedOn: INSTALLED_ON, note: 'Kitchen' },
      { serial: '00456', litres: 7, installedOn: INSTALLED_ON, note: null },
    ];

    const rows = await readSheet(await toSpreadsheet({ sheetName: 'Meters', columns: COLUMNS, items }));

    expect(rows).toEqual([HEADER, ['00123', 412, INSTALLED_ON, 'Kitchen'], ['00456', 7, INSTALLED_ON, null]]);
  });

  it('writes the header alone when there are no items', async () => {
    const rows = await readSheet(await toSpreadsheet({ sheetName: 'Meters', columns: COLUMNS, items: [] }));

    expect(rows).toEqual([HEADER]);
  });
});

describe('toSpreadsheet with links', () => {
  type Bill = { label: string; url: string | null };

  const LINK_COLUMNS: SpreadsheetColumn<Bill>[] = [
    { title: 'Bill', width: 10, valueOf: (bill) => bill.label, linkOf: (bill) => bill.url },
  ];

  it('links each cell to its url and keeps the cell text, when a column has links', async () => {
    const items = [
      { label: 'Open', url: 'https://meter.example/api/bills/7' },
      { label: 'Open', url: 'https://meter.example/api/bills/9' },
    ];

    const xlsx = await toSpreadsheet({ sheetName: 'Bills', columns: LINK_COLUMNS, items });

    expect(await readSheet(xlsx)).toEqual([['Bill'], ['Open'], ['Open']]);
    expect(sheetLinks(xlsx)).toEqual({
      A2: 'https://meter.example/api/bills/7',
      A3: 'https://meter.example/api/bills/9',
    });
  });

  it('leaves a cell plain when its item has no url', async () => {
    const items = [
      { label: 'Plain', url: null },
      { label: 'Open', url: 'https://meter.example/api/bills/9' },
    ];

    const xlsx = await toSpreadsheet({ sheetName: 'Bills', columns: LINK_COLUMNS, items });

    expect(sheetLinks(xlsx)).toEqual({ A3: 'https://meter.example/api/bills/9' });
  });

  it('writes no links when no cell has one', async () => {
    const xlsx = await toSpreadsheet({ sheetName: 'Meters', columns: COLUMNS, items: [] });

    expect(sheetLinks(xlsx)).toEqual({});
  });
});

describe('toSpreadsheet with a sum row', () => {
  const SUMMED_COLUMNS = COLUMNS.map((column) => ({ ...column, isSummed: column.title === 'Litres' }));
  const meter = (serial: string, litres: number) => ({ serial, litres, installedOn: INSTALLED_ON, note: null });

  it('adds a row below the data with the label and the sum of the summed column, when asked for one', async () => {
    const items = [meter('00123', 412), meter('00456', 7)];

    const xlsx = await toSpreadsheet({ sheetName: 'Meters', columns: SUMMED_COLUMNS, items, sumRowLabel: 'Total' });

    expect((await readSheet(xlsx)).at(-1)).toEqual(['Total', 419, null, null]);
    expect(sheetFormulas(xlsx)).toEqual({ B4: 'SUM(B2:B3)' });
  });

  it('adds up only the numbers when some cells of the summed column are empty', async () => {
    const columns: SpreadsheetColumn<{ litres: number | null }>[] = [
      { title: 'Name', width: 10, valueOf: () => 'Meter' },
      { title: 'Litres', width: 8, valueOf: (item) => item.litres, isSummed: true },
    ];
    const items = [{ litres: 5 }, { litres: null }, { litres: 2 }];

    const xlsx = await toSpreadsheet({ sheetName: 'Meters', columns, items, sumRowLabel: 'Total' });

    expect((await readSheet(xlsx)).at(-1)).toEqual(['Total', 7]);
    expect(sheetFormulas(xlsx)).toEqual({ B5: 'SUM(B2:B4)' });
  });

  it('keeps the sum free of floating-point noise when the numbers have decimals', async () => {
    const columns: SpreadsheetColumn<{ euros: number }>[] = [
      { title: 'Name', width: 10, valueOf: () => 'Bill' },
      { title: 'Euros', width: 8, valueOf: (item) => item.euros, isSummed: true },
    ];

    const xlsx = await toSpreadsheet({
      sheetName: 'Bills',
      columns,
      items: [{ euros: 0.1 }, { euros: 0.2 }],
      sumRowLabel: 'Total',
    });

    expect((await readSheet(xlsx)).at(-1)).toEqual(['Total', 0.3]);
  });

  it('writes a sum of 0, and no formula, when there are no items', async () => {
    const xlsx = await toSpreadsheet({ sheetName: 'Meters', columns: SUMMED_COLUMNS, items: [], sumRowLabel: 'Total' });

    expect(await readSheet(xlsx)).toEqual([HEADER, ['Total', 0, null, null]]);
    expect(sheetFormulas(xlsx)).toEqual({});
  });

  it('writes no sum row when the table asks for none', async () => {
    const xlsx = await toSpreadsheet({ sheetName: 'Meters', columns: SUMMED_COLUMNS, items: [meter('00123', 412)] });

    expect(await readSheet(xlsx)).toHaveLength(2);
    expect(sheetFormulas(xlsx)).toEqual({});
  });
});

describe('toSpreadsheetTime', () => {
  it.each([
    ['2026-01-15T09:05:00.000Z', 'Europe/Lisbon', '2026-01-15T09:05:00.000Z'],
    ['2026-07-15T09:05:00.000Z', 'Europe/Lisbon', '2026-07-15T10:05:00.000Z'],
    ['2026-07-15T23:30:00.000Z', 'Europe/Berlin', '2026-07-16T01:30:00.000Z'],
    ['2026-07-15T09:05:00.000Z', 'UTC', '2026-07-15T09:05:00.000Z'],
  ])('gives the clock time of %s in %s when it is read there', (moment, timeZone, wallClock) => {
    expect(toSpreadsheetTime(new Date(moment), timeZone)).toEqual(new Date(wallClock));
  });
});
