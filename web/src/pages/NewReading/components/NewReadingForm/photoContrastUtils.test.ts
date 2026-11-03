import { clearEdgeBlack, toBlackAndWhite } from './photoContrastUtils';

const BLACK = [0, 0, 0, 255];
const WHITE = [255, 255, 255, 255];

// RGBA pixels, one after the other, as a canvas hands them over.
function pixelsOf(...colours: number[][]): Uint8ClampedArray {
  return new Uint8ClampedArray(colours.flat());
}

function coloursOf(pixels: Uint8ClampedArray): number[][] {
  const colours: number[][] = [];

  for (let i = 0; i < pixels.length; i += 4) colours.push([...pixels.slice(i, i + 4)]);

  return colours;
}

describe('toBlackAndWhite', () => {
  it('turns dark digits black and the light wheel around them white', () => {
    const pixels = pixelsOf([30, 30, 30, 255], [220, 220, 220, 255], [40, 40, 40, 255], [230, 230, 230, 255]);

    toBlackAndWhite(pixels);

    expect(coloursOf(pixels)).toEqual([BLACK, WHITE, BLACK, WHITE]);
  });

  it('still splits a dim, low-contrast photo into black and white', () => {
    const pixels = pixelsOf([100, 100, 100, 255], [104, 104, 104, 255], [136, 136, 136, 255], [140, 140, 140, 255]);

    toBlackAndWhite(pixels);

    expect(coloursOf(pixels)).toEqual([BLACK, BLACK, WHITE, WHITE]);
  });

  it('turns red digits black, so they are read with the rest', () => {
    const pixels = pixelsOf([200, 20, 20, 255], [240, 240, 240, 255]);

    toBlackAndWhite(pixels);

    expect(coloursOf(pixels)).toEqual([BLACK, WHITE]);
  });

  it('leaves a photo of one flat colour white', () => {
    const pixels = pixelsOf([120, 120, 120, 255], [120, 120, 120, 255]);

    toBlackAndWhite(pixels);

    expect(coloursOf(pixels)).toEqual([WHITE, WHITE]);
  });
});

// A picture as rows of B (black) and W (white), and back.
function pictureOf(rows: string[]): Uint8ClampedArray {
  return pixelsOf(...rows.flatMap((row) => [...row].map((pixel) => (pixel === 'B' ? BLACK : WHITE))));
}

function rowsOf(pixels: Uint8ClampedArray, width: number): string[] {
  const shades = coloursOf(pixels).map((colour) => (colour[0] === 0 ? 'B' : 'W'));
  const rows: string[] = [];

  for (let i = 0; i < shades.length; i += width) rows.push(shades.slice(i, i + width).join(''));

  return rows;
}

describe('clearEdgeBlack', () => {
  it('whitens the black frame round a crop and keeps the digit inside it', () => {
    const pixels = pictureOf(['BBBBB', 'BWWWB', 'BWBWB', 'BWWWB', 'BBBBB']);

    clearEdgeBlack(pixels, 5);

    expect(rowsOf(pixels, 5)).toEqual(['WWWWW', 'WWWWW', 'WWBWW', 'WWWWW', 'WWWWW']);
  });

  it('whitens black that reaches the edge only through other black', () => {
    const pixels = pictureOf(['WWWWW', 'BBBWW', 'WWBWW', 'WWWWB', 'WWWWW']);

    clearEdgeBlack(pixels, 5);

    expect(rowsOf(pixels, 5)).toEqual(['WWWWW', 'WWWWW', 'WWWWW', 'WWWWW', 'WWWWW']);
  });

  it('leaves black that does not touch the edge', () => {
    const pixels = pictureOf(['WWWW', 'WBBW', 'WWWW']);

    clearEdgeBlack(pixels, 4);

    expect(rowsOf(pixels, 4)).toEqual(['WWWW', 'WBBW', 'WWWW']);
  });
});
