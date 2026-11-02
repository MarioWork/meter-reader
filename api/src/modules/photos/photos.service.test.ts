import { fakeJpeg } from '../../lib/jpeg.fixture.ts';
import { openUpload, removeUpload, saveUpload } from '../../lib/uploads.ts';
import { photosRepository } from './photos.repository.ts';
import { addPhoto, getPhotoFile } from './photos.service.ts';

vi.mock('./photos.repository.ts', () => ({
  photosRepository: { create: vi.fn(), findById: vi.fn() },
}));

vi.mock('../../lib/uploads.ts', () => ({
  saveUpload: vi.fn(),
  openUpload: vi.fn(),
  removeUpload: vi.fn(),
}));

const FILE_NAME = '5b0f3c1e-6f7a-4d2b-9a51-2c8e0d9b7f10.jpg';
const SAVED_ROW = { id: 4, fileName: FILE_NAME, createdAt: new Date('2026-11-02T09:00:00.000Z') };

describe('addPhoto', () => {
  it('keeps the file, then its row, and answers the id when the photo is a shrunk JPEG', async () => {
    const photo = fakeJpeg({ width: 1500, height: 2000 });
    vi.mocked(saveUpload).mockResolvedValueOnce(FILE_NAME);
    vi.mocked(photosRepository.create).mockResolvedValueOnce(SAVED_ROW);

    const saved = await addPhoto(photo);

    expect(saveUpload).toHaveBeenCalledWith(photo, '.jpg');
    expect(photosRepository.create).toHaveBeenCalledWith({ fileName: FILE_NAME, sizeBytes: photo.length });
    expect(saved).toEqual({ id: 4, createdAt: '2026-11-02T09:00:00.000Z' });
  });

  it('removes the file again when its row cannot be saved', async () => {
    const failure = new Error('database down');
    vi.mocked(saveUpload).mockResolvedValueOnce(FILE_NAME);
    vi.mocked(photosRepository.create).mockRejectedValueOnce(failure);

    await expect(addPhoto(fakeJpeg({ width: 800, height: 600 }))).rejects.toBe(failure);

    expect(removeUpload).toHaveBeenCalledWith(FILE_NAME);
  });

  it('throws PHOTO_TOO_LARGE and keeps nothing when the longest side is over 2000 px', async () => {
    await expect(addPhoto(fakeJpeg({ width: 2400, height: 1800 }))).rejects.toMatchObject({ code: 'PHOTO_TOO_LARGE' });

    expect(saveUpload).not.toHaveBeenCalled();
  });
});

describe('getPhotoFile', () => {
  it('throws NOT_FOUND when the row exists but its file is gone', async () => {
    vi.mocked(photosRepository.findById).mockResolvedValueOnce(SAVED_ROW);
    vi.mocked(openUpload).mockResolvedValueOnce(undefined);

    await expect(getPhotoFile(4)).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });
});
