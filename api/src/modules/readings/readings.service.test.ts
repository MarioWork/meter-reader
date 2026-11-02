import { readingsRepository } from './readings.repository.ts';
import { NotFoundError } from '../../lib/httpErrors.ts';
import { addReading, deleteReading, getReadings } from './readings.service.ts';

vi.mock('./readings.repository.ts', () => ({
  readingsRepository: { create: vi.fn(), findPage: vi.fn(), deleteById: vi.fn() },
}));

const SAVED_ROW = {
  id: 7,
  digits: '00123',
  date: new Date('2026-10-31T00:00:00.000Z'),
  status: 'NOT_SENT' as const,
  createdAt: new Date('2026-11-01T08:15:00.000Z'),
  photo: null,
};

describe('addReading', () => {
  it('stores the day as midnight UTC and answers it as a calendar day when the reading is saved', async () => {
    vi.mocked(readingsRepository.create).mockResolvedValueOnce(SAVED_ROW);

    const reading = await addReading({ digits: '00123', date: '2026-10-31' });

    expect(readingsRepository.create).toHaveBeenCalledWith({
      digits: '00123',
      date: new Date('2026-10-31T00:00:00.000Z'),
      photoId: undefined,
    });
    expect(reading).toEqual({
      id: 7,
      digits: '00123',
      date: '2026-10-31',
      status: 'notSent',
      createdAt: '2026-11-01T08:15:00.000Z',
      photoId: null,
    });
  });

  it('passes the photo id on and answers it when the reading has a photo', async () => {
    vi.mocked(readingsRepository.create).mockResolvedValueOnce({ ...SAVED_ROW, photo: { id: 4 } });

    const reading = await addReading({ digits: '00123', date: '2026-10-31', photoId: 4 });

    expect(readingsRepository.create).toHaveBeenCalledWith(expect.objectContaining({ photoId: 4 }));
    expect(reading.photoId).toBe(4);
  });
});

describe('getReadings', () => {
  it('asks for the rows of the page and answers them with the total when a page is asked', async () => {
    vi.mocked(readingsRepository.findPage).mockResolvedValueOnce({
      rows: [{ ...SAVED_ROW, status: 'FAILED' }],
      total: 21,
    });

    const page = await getReadings({ page: 3, size: 10 });

    expect(readingsRepository.findPage).toHaveBeenCalledWith({ skip: 20, take: 10 });
    expect(page).toMatchObject({ totalResultNumber: 21, currentPage: 3, data: [{ id: 7, status: 'failed' }] });
  });
});

describe('deleteReading', () => {
  it('deletes the reading by its id when the reading exists', async () => {
    vi.mocked(readingsRepository.deleteById).mockResolvedValueOnce(SAVED_ROW);

    await deleteReading(7);

    expect(readingsRepository.deleteById).toHaveBeenCalledWith(7);
  });

  it('throws NotFoundError when the reading does not exist', async () => {
    vi.mocked(readingsRepository.deleteById).mockResolvedValueOnce(null);

    const deleting = deleteReading(7);

    await expect(deleting).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleting).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
