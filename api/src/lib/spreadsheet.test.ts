import { readSheet } from 'read-excel-file/node';
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
