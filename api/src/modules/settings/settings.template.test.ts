import { fillMessageTemplate, findUnknownPlaceholder } from './settings.template.ts';

const VALUES = { reading: '00123', date: '3 November 2026', client: '0042-7' };

describe('fillMessageTemplate', () => {
  it('puts the reading and the date in place of every placeholder when the template repeats them', () => {
    const filled = fillMessageTemplate('Leitura - {reading} - {date} ({reading})', VALUES);

    expect(filled).toBe('Leitura - 00123 - 3 November 2026 (00123)');
  });

  it('puts the client number in place of {client}', () => {
    expect(fillMessageTemplate('Client {client}: {reading}', VALUES)).toBe('Client 0042-7: 00123');
  });

  it('leaves {client} empty when no client number is saved', () => {
    expect(fillMessageTemplate('Client {client}.', { ...VALUES, client: null })).toBe('Client .');
  });

  it('answers the template as it is when it has no placeholder', () => {
    expect(fillMessageTemplate('Meter reading', VALUES)).toBe('Meter reading');
  });
});

describe('findUnknownPlaceholder', () => {
  it('answers undefined when every placeholder is {reading}, {date} or {client}', () => {
    expect(findUnknownPlaceholder('Leitura {date}: {reading} ({client})')).toBeUndefined();
  });

  it('answers the first unknown placeholder when the template has a typo', () => {
    expect(findUnknownPlaceholder('Leitura {readng} {date} {day}')).toBe('{readng}');
  });

  it('answers the placeholder as unknown when it is in the wrong case or the braces are empty', () => {
    expect(findUnknownPlaceholder('{Reading}')).toBe('{Reading}');
    expect(findUnknownPlaceholder('Reading {}')).toBe('{}');
  });
});
