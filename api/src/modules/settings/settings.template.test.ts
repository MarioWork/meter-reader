import { fillMessageTemplate, findUnknownPlaceholder } from './settings.template.ts';

const VALUES = { reading: '00123', date: '3 November 2026' };

describe('fillMessageTemplate', () => {
  it('puts the reading and the date in place of every placeholder when the template repeats them', () => {
    const filled = fillMessageTemplate('Leitura - {reading} - {date} ({reading})', VALUES);

    expect(filled).toBe('Leitura - 00123 - 3 November 2026 (00123)');
  });

  it('answers the template as it is when it has no placeholder', () => {
    expect(fillMessageTemplate('Meter reading', VALUES)).toBe('Meter reading');
  });
});

describe('findUnknownPlaceholder', () => {
  it('answers undefined when every placeholder is {reading} or {date}', () => {
    expect(findUnknownPlaceholder('Leitura {date}: {reading}')).toBeUndefined();
  });

  it('answers the first unknown placeholder when the template has a typo', () => {
    expect(findUnknownPlaceholder('Leitura {readng} {date} {day}')).toBe('{readng}');
  });

  it('answers the placeholder as unknown when it is in the wrong case or the braces are empty', () => {
    expect(findUnknownPlaceholder('{Reading}')).toBe('{Reading}');
    expect(findUnknownPlaceholder('Reading {}')).toBe('{}');
  });
});
