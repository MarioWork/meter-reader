import { fitWithin, PHOTO_MAX_SIDE_PX } from './photoUtils';

describe('fitWithin', () => {
  it('shrinks a landscape photo to 2000 px wide, keeping its shape', () => {
    expect(fitWithin({ width: 4032, height: 3024 }, PHOTO_MAX_SIDE_PX)).toEqual({ width: 2000, height: 1500 });
  });

  it('shrinks a portrait photo to 2000 px high, keeping its shape', () => {
    expect(fitWithin({ width: 3024, height: 4032 }, PHOTO_MAX_SIDE_PX)).toEqual({ width: 1500, height: 2000 });
  });

  it('keeps a photo that already fits at its own size', () => {
    expect(fitWithin({ width: 1600, height: 1200 }, PHOTO_MAX_SIDE_PX)).toEqual({ width: 1600, height: 1200 });
  });
});
