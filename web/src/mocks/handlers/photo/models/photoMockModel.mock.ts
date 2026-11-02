import type { PhotoApiModel } from '@app-types/models';

// Fixed, so the mocks stay deterministic.
const MOCK_UPLOADED_AT = '2026-11-02T09:00:00.000Z';

export const createPhotoMockModel = (overrides?: Partial<PhotoApiModel>): PhotoApiModel => ({
  id: 1,
  createdAt: MOCK_UPLOADED_AT,
  ...overrides,
});

// A stand-in picture for a mock history photo: a meter face with the photo's number, so the demo shows something.
export const createPhotoMockImage = (photoId: number): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">` +
  `<rect width="400" height="300" fill="#e5e7eb"/>` +
  `<circle cx="200" cy="150" r="120" fill="#ffffff" stroke="#374151" stroke-width="8"/>` +
  `<rect x="110" y="125" width="180" height="50" fill="#111827"/>` +
  `<text x="200" y="162" font-family="monospace" font-size="32" fill="#ffffff" text-anchor="middle">` +
  `PHOTO ${photoId}</text></svg>`;
