import {
  bodyTemplateSchema,
  fillMessageTemplate,
  findUnknownPlaceholder,
  subjectTemplateSchema,
} from './messageTemplateUtils';

const VALUES = { reading: '00123', date: '3 November 2026' };

describe('fillMessageTemplate', () => {
  it('puts the reading and the date in place of every {reading} and {date}', () => {
    expect(fillMessageTemplate('Leitura - {reading} - {date} ({reading})', VALUES)).toBe(
      'Leitura - 00123 - 3 November 2026 (00123)',
    );
  });

  it('leaves anything else in braces as it is', () => {
    expect(fillMessageTemplate('{day}: {reading}', VALUES)).toBe('{day}: 00123');
  });
});

describe('findUnknownPlaceholder', () => {
  it('finds nothing when every placeholder is {reading} or {date}', () => {
    expect(findUnknownPlaceholder('Leitura {date}: {reading}')).toBeUndefined();
  });

  it('finds the first placeholder that is neither, such as a typo', () => {
    expect(findUnknownPlaceholder('Leitura {readng} {Date}')).toBe('{readng}');
  });
});

describe('subjectTemplateSchema and bodyTemplateSchema', () => {
  it('takes a template with only known placeholders, trimmed', async () => {
    expect(await subjectTemplateSchema.validate('  Leitura {date} ')).toBe('Leitura {date}');
  });

  it('refuses an unknown placeholder, naming it', async () => {
    await expect(bodyTemplateSchema.validate('Leitura {readng}')).rejects.toThrow(
      '{readng} is not a placeholder. Use {reading} or {date}.',
    );
  });

  it('refuses an empty template', async () => {
    await expect(subjectTemplateSchema.validate('   ')).rejects.toThrow('Write a subject template.');
    await expect(bodyTemplateSchema.validate('')).rejects.toThrow('Write a body template.');
  });
});
