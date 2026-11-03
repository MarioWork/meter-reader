import {
  boxBetween,
  boxInPixels,
  DEFAULT_CROP,
  isInsideBox,
  isWholePhoto,
  moveBox,
  moveBoxMiddleTo,
  resizeBox,
  WHOLE_PHOTO,
  turnCropLeft,
  turnCropRight,
  turnCanvas,
  turnedSize,
} from './photoCropUtils';
import type { CropPoint, QuarterTurn } from './types';

const CLOSE_TO_DIGITS = 6;

function expectCloseTo(actual: object, expected: object) {
  for (const [side, value] of Object.entries(expected)) {
    expect(actual).toHaveProperty(side, expect.closeTo(value as number, CLOSE_TO_DIGITS));
  }
}

describe('turnCropRight', () => {
  it('turns the photo a quarter clockwise and keeps the box over the same part of it', () => {
    const turned = turnCropRight({ turn: 0, box: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 } });

    expect(turned.turn).toBe(90);
    expectCloseTo(turned.box, { x: 0.4, y: 0.1, width: 0.4, height: 0.3 });
  });

  it('comes back round to no turn after four quarters', () => {
    const fourTurns = [1, 2, 3, 4].reduce((crop) => turnCropRight(crop), DEFAULT_CROP);

    expect(fourTurns.turn).toBe(0);
    expectCloseTo(fourTurns.box, DEFAULT_CROP.box);
  });
});

describe('turnCropLeft', () => {
  it('turns the photo a quarter anticlockwise and keeps the box over the same part of it', () => {
    const turned = turnCropLeft({ turn: 0, box: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 } });

    expect(turned.turn).toBe(270);
    expectCloseTo(turned.box, { x: 0.2, y: 0.6, width: 0.4, height: 0.3 });
  });

  it('undoes a turn right', () => {
    const back = turnCropLeft(turnCropRight(DEFAULT_CROP));

    expect(back.turn).toBe(0);
    expectCloseTo(back.box, DEFAULT_CROP.box);
  });
});

describe('moveBox', () => {
  it('moves the box by the given fractions of the photo', () => {
    expectCloseTo(moveBox({ x: 0.2, y: 0.2, width: 0.5, height: 0.2 }, { x: 0.1, y: -0.1 }), { x: 0.3, y: 0.1 });
  });

  it('stops the box at the edge of the photo', () => {
    const moved = moveBox({ x: 0.4, y: 0.05, width: 0.5, height: 0.2 }, { x: 0.3, y: -0.3 });

    expectCloseTo(moved, { x: 0.5, y: 0, width: 0.5, height: 0.2 });
  });
});

describe('moveBoxMiddleTo', () => {
  it('centres the box on the point', () => {
    const moved = moveBoxMiddleTo({ x: 0.2, y: 0.4, width: 0.6, height: 0.2 }, { x: 0.5, y: 0.2 });

    expectCloseTo(moved, { x: 0.2, y: 0.1, width: 0.6, height: 0.2 });
  });

  it('keeps the box on the photo for a point near the edge', () => {
    const moved = moveBoxMiddleTo({ x: 0.2, y: 0.4, width: 0.6, height: 0.2 }, { x: 0.95, y: 0.98 });

    expectCloseTo(moved, { x: 0.4, y: 0.8 });
  });
});

describe('isWholePhoto', () => {
  it('is true for the whole photo, unturned', () => {
    expect(isWholePhoto(WHOLE_PHOTO)).toBe(true);
  });

  it('is false for a marked part, or the whole photo turned', () => {
    expect(isWholePhoto(DEFAULT_CROP)).toBe(false);
    expect(isWholePhoto({ ...WHOLE_PHOTO, turn: 90 })).toBe(false);
  });
});

describe('resizeBox', () => {
  it('grows and shrinks the box around its middle', () => {
    const resized = resizeBox({ x: 0.2, y: 0.4, width: 0.6, height: 0.2 }, { width: 0.2, height: -0.1 });

    expectCloseTo(resized, { x: 0.1, y: 0.45, width: 0.8, height: 0.1 });
  });

  it('never grows the box past the photo', () => {
    const resized = resizeBox({ x: 0.1, y: 0.4, width: 0.8, height: 0.2 }, { width: 0.4, height: 0 });

    expectCloseTo(resized, { x: 0, width: 1 });
  });

  it('never shrinks the box to nothing', () => {
    const resized = resizeBox({ x: 0.4, y: 0.4, width: 0.1, height: 0.1 }, { width: -0.5, height: -0.5 });

    expect(resized.width).toBeGreaterThan(0);
    expect(resized.height).toBeGreaterThan(0);
  });
});

describe('boxBetween', () => {
  it('draws the box between two corners, whichever way the drag went', () => {
    expectCloseTo(boxBetween({ x: 0.7, y: 0.6 }, { x: 0.2, y: 0.4 }), { x: 0.2, y: 0.4, width: 0.5, height: 0.2 });
  });

  it('keeps a box drawn past the edge inside the photo', () => {
    expectCloseTo(boxBetween({ x: 0.5, y: 0.5 }, { x: 1.3, y: -0.2 }), { x: 0.5, y: 0, width: 0.5, height: 0.5 });
  });
});

describe('isInsideBox', () => {
  const box = { x: 0.2, y: 0.4, width: 0.6, height: 0.2 };

  it('is true for a point on the box', () => {
    expect(isInsideBox({ x: 0.5, y: 0.5 }, box)).toBe(true);
  });

  it('is false for a point off the box', () => {
    expect(isInsideBox({ x: 0.5, y: 0.9 }, box)).toBe(false);
  });
});

describe('turnedSize', () => {
  it('swaps the sides for a quarter turn', () => {
    expect(turnedSize({ width: 2000, height: 1500 }, 90)).toEqual({ width: 1500, height: 2000 });
    expect(turnedSize({ width: 2000, height: 1500 }, 270)).toEqual({ width: 1500, height: 2000 });
  });

  it('keeps the sides for no turn or a half turn', () => {
    expect(turnedSize({ width: 2000, height: 1500 }, 180)).toEqual({ width: 2000, height: 1500 });
  });
});

describe('boxInPixels', () => {
  it('turns the fractions into whole pixels of the photo', () => {
    const box = { x: 0.2, y: 0.4, width: 0.6, height: 0.2 };

    expect(boxInPixels(box, { width: 1500, height: 2000 })).toEqual({ x: 300, y: 800, width: 900, height: 400 });
  });

  it('is at least one pixel each way', () => {
    const box = { x: 0, y: 0, width: 0.0001, height: 0.0001 };

    expect(boxInPixels(box, { width: 100, height: 100 })).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });
});

// Just enough of a canvas to follow where turnCanvas puts each corner of the photo.
type PointMove = (point: CropPoint) => CropPoint;

type TurnCorners = [turn: QuarterTurn, topLeft: CropPoint, bottomRight: CropPoint];

function fakeContext() {
  const moves: PointMove[] = [];
  const context = {
    translate: (x: number, y: number) => moves.push((point) => ({ x: point.x + x, y: point.y + y })),
    rotate: (angle: number) =>
      moves.push((point) => ({
        x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
        y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
      })),
  };

  // Each call applies to what is drawn after it, so the last one moves a point first.
  const whereDrawn = (point: CropPoint) => moves.reduceRight((moved, move) => move(moved), point);

  return { context: context as unknown as CanvasRenderingContext2D, whereDrawn };
}

describe('turnCanvas', () => {
  const size = { width: 400, height: 300 };
  const QUARTER_TURNS: TurnCorners[] = [
    [0, { x: 0, y: 0 }, { x: 400, y: 300 }],
    [90, { x: 300, y: 0 }, { x: 0, y: 400 }],
    [180, { x: 400, y: 300 }, { x: 0, y: 0 }],
    [270, { x: 0, y: 400 }, { x: 300, y: 0 }],
  ];

  it.each(QUARTER_TURNS)('draws the photo turned %i° clockwise, all on the canvas', (turn, topLeft, bottomRight) => {
    const { context, whereDrawn } = fakeContext();

    turnCanvas(context, size, turn);

    expectCloseTo(whereDrawn({ x: 0, y: 0 }), topLeft);
    expectCloseTo(whereDrawn({ x: 400, y: 300 }), bottomRight);
  });
});
