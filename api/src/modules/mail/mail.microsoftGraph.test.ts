import { buildSendMailRequest } from './mail.microsoftGraph.ts';

const MAIL = { to: 'readings@water-provider.example', subject: 'Leitura', body: 'Reading: 00123' };
const PHOTO = { name: 'meter-2026-10-31.jpg', contentType: 'image/jpeg', contents: Buffer.from('jpeg') };

function bodyOf(json: string): string {
  return (JSON.parse(json) as { message: { body: { content: string } } }).message.body.content;
}

describe('buildSendMailRequest', () => {
  it('ends the body with an empty line when a photo goes with it, so mail apps show the photo on a row of its own', () => {
    expect(bodyOf(buildSendMailRequest({ ...MAIL, attachment: PHOTO }).json)).toBe('Reading: 00123\n\n');
  });

  it('sends the body exactly as written when there is no photo', () => {
    expect(bodyOf(buildSendMailRequest(MAIL).json)).toBe('Reading: 00123');
  });
});
