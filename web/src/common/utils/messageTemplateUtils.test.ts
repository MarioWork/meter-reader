import { MessageDateFormatUtil, MessageDateLanguageUtil } from '@app-types/utility';
import {
  bodyTemplateSchema,
  fillMessageTemplate,
  fillTodaysEmail,
  findUnknownPlaceholder,
  subjectTemplateSchema,
} from './messageTemplateUtils';

const VALUES = { reading: '00123', date: '3 November 2026', client: '0042-7' };
const TODAY = new Date(2026, 10, 3, 12);

describe('fillMessageTemplate', () => {
  it('puts the reading and the date in place of every {reading} and {date}', () => {
    expect(fillMessageTemplate('Leitura - {reading} - {date} ({reading})', VALUES)).toBe(
      'Leitura - 00123 - 3 November 2026 (00123)',
    );
  });

  it('puts the client number in place of {client}, or nothing when none is saved', () => {
    expect(fillMessageTemplate('Client {client}: {reading}', VALUES)).toBe('Client 0042-7: 00123');
    expect(fillMessageTemplate('Client {client}.', { ...VALUES, client: null })).toBe('Client .');
  });

  it('leaves anything else in braces as it is', () => {
    expect(fillMessageTemplate('{day}: {reading}', VALUES)).toBe('{day}: 00123');
  });
});

describe('fillTodaysEmail', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(TODAY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fills the subject and body with the reading, trimmed, and today in the chosen date format', () => {
    const settings = {
      subjectTemplate: 'Leitura {date}',
      bodyTemplate: 'Leitura - {reading} - {date}',
      dateFormat: MessageDateFormatUtil.LONG_MONTH,
      dateLanguage: MessageDateLanguageUtil.ENGLISH,
      clientNumber: null,
    };

    expect(fillTodaysEmail(settings, ' 00123 ')).toEqual({
      subject: 'Leitura 3 November 2026',
      body: 'Leitura - 00123 - 3 November 2026',
    });
  });

  it('writes today in another format when another one is chosen', () => {
    const settings = {
      subjectTemplate: 'Leitura {date}',
      bodyTemplate: '{reading}',
      dateFormat: MessageDateFormatUtil.DAY_MONTH_YEAR,
      dateLanguage: MessageDateLanguageUtil.ENGLISH,
      clientNumber: null,
    };

    expect(fillTodaysEmail(settings, '00123').subject).toBe('Leitura 03/11/2026');
  });

  it('writes today in Portuguese when Portuguese is chosen', () => {
    const settings = {
      subjectTemplate: 'Leitura {date}',
      bodyTemplate: '{reading}',
      dateFormat: MessageDateFormatUtil.LONG_MONTH,
      dateLanguage: MessageDateLanguageUtil.PORTUGUESE,
      clientNumber: null,
    };

    expect(fillTodaysEmail(settings, '00123').subject).toBe('Leitura 3 de novembro de 2026');
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
      '{readng} is not a placeholder. Use {reading}, {date} or {client}.',
    );
  });

  it('refuses an empty template', async () => {
    await expect(subjectTemplateSchema.validate('   ')).rejects.toThrow('Write a subject template.');
    await expect(bodyTemplateSchema.validate('')).rejects.toThrow('Write a body template.');
  });
});
