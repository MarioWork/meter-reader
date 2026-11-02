import { prisma } from '../../lib/prisma.ts';
import { photosRepository } from './photos.repository.ts';

const NOW = new Date('2026-11-02T09:00:00.000Z');
const TWO_DAYS_AGO = new Date('2026-10-31T09:00:00.000Z');
const ONE_DAY_AGO = new Date('2026-11-01T09:00:00.000Z');

async function addPhotoRow(fileName: string, createdAt: Date, readingId?: number) {
  return prisma.photo.create({ data: { fileName, sizeBytes: 100, createdAt, readingId } });
}

beforeEach(async () => {
  await prisma.photo.deleteMany();
  await prisma.reading.deleteMany();
});

describe('deleteUnlinkedBefore', () => {
  it('deletes and answers only the unlinked photos older than the cutoff when old, linked and new photos exist', async () => {
    const reading = await prisma.reading.create({ data: { digits: '00123', date: TWO_DAYS_AGO } });
    await addPhotoRow('old-unlinked.jpg', TWO_DAYS_AGO);
    await addPhotoRow('old-linked.jpg', TWO_DAYS_AGO, reading.id);
    await addPhotoRow('new-unlinked.jpg', NOW);

    const removed = await photosRepository.deleteUnlinkedBefore(ONE_DAY_AGO);

    expect(removed).toEqual(['old-unlinked.jpg']);
    const kept = await prisma.photo.findMany({ select: { fileName: true }, orderBy: { fileName: 'asc' } });
    expect(kept).toEqual([{ fileName: 'new-unlinked.jpg' }, { fileName: 'old-linked.jpg' }]);
  });
});
