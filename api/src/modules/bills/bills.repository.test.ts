import { prisma } from '../../lib/prisma.ts';
import { billsRepository } from './bills.repository.ts';

const NOW = new Date('2026-11-03T09:00:00.000Z');
const TWO_DAYS_AGO = new Date('2026-11-01T09:00:00.000Z');
const ONE_DAY_AGO = new Date('2026-11-02T09:00:00.000Z');

async function addBillRow(fileName: string, createdAt: Date, readingId?: number) {
  return prisma.bill.create({ data: { fileName, fileType: 'PDF', sizeBytes: 100, createdAt, readingId } });
}

beforeEach(async () => {
  await prisma.bill.deleteMany();
  await prisma.reading.deleteMany();
});

describe('deleteUnlinkedBefore', () => {
  it('deletes and answers only the unlinked bills older than the cutoff when old, linked and new bills exist', async () => {
    const reading = await prisma.reading.create({ data: { digits: '00123', date: TWO_DAYS_AGO } });
    await addBillRow('old-unlinked.pdf', TWO_DAYS_AGO);
    await addBillRow('old-linked.pdf', TWO_DAYS_AGO, reading.id);
    await addBillRow('new-unlinked.pdf', NOW);

    const removed = await billsRepository.deleteUnlinkedBefore(ONE_DAY_AGO);

    expect(removed).toEqual(['old-unlinked.pdf']);
    const kept = await prisma.bill.findMany({ select: { fileName: true }, orderBy: { fileName: 'asc' } });
    expect(kept).toEqual([{ fileName: 'new-unlinked.pdf' }, { fileName: 'old-linked.pdf' }]);
  });
});
