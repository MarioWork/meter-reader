import indexCss from './index.css?raw';

// WCAG 2.2 AA: 4.5:1 for text (1.4.3), 3:1 for the edge of a control and the focus ring (1.4.11).
const TEXT_CONTRAST = 4.5;
const NON_TEXT_CONTRAST = 3;

const SURFACES = ['background', 'card', 'popover', 'muted', 'secondary', 'accent'];

// Text tokens that are read on any surface: body text, muted text, links, and the status colours used as text.
const TEXT_ON_ANY_SURFACE = ['foreground', 'muted-foreground', 'primary', 'destructive', 'success', 'warning'];

// Filled tokens and the text that sits on them.
const FILLS = ['primary', 'secondary', 'accent', 'destructive', 'success', 'warning', 'card', 'popover', 'muted'];

// Edges that must stand out from the surface they sit on.
const EDGES = ['input', 'ring'];

// Chart marks, against the card every chart is drawn on.
const CHART_MARKS = ['chart-1'];
const CHART_SURFACE = 'card';

const THEME_SELECTORS = { light: ':root', dark: '.dark' };

// The sRGB relative luminance formula (WCAG 2.2, "relative luminance").
const CHANNEL_MAX = 255;
const LINEAR_THRESHOLD = 0.04045;
const LINEAR_DIVISOR = 12.92;
const GAMMA_OFFSET = 0.055;
const GAMMA_DIVISOR = 1.055;
const GAMMA = 2.4;
const RED_WEIGHT = 0.2126;
const GREEN_WEIGHT = 0.7152;
const BLUE_WEIGHT = 0.0722;
// The flare term WCAG adds to both luminances before dividing.
const FLARE = 0.05;

type ContrastPair = { text: string; surface: string; minimum: number };

function themeVariables(selector: string): Record<string, string> {
  const escapedSelector = selector.replace('.', '\\.');
  const block = new RegExp(`^${escapedSelector} \\{([^}]*)\\}`, 'm').exec(indexCss);
  if (!block) throw new Error(`No ${selector} block in index.css`);

  const declarations = [...block[1].matchAll(/--([\w-]+):\s*([^;]+);/g)];

  return Object.fromEntries(declarations.map(([, name, value]) => [name, value.trim()]));
}

function relativeLuminance(hexColour: string) {
  const channels = [1, 3, 5].map((start) => parseInt(hexColour.slice(start, start + 2), 16) / CHANNEL_MAX);
  const [red, green, blue] = channels.map((channel) =>
    channel <= LINEAR_THRESHOLD ? channel / LINEAR_DIVISOR : ((channel + GAMMA_OFFSET) / GAMMA_DIVISOR) ** GAMMA,
  );

  return RED_WEIGHT * red + GREEN_WEIGHT * green + BLUE_WEIGHT * blue;
}

function contrastRatio(first: string, second: string) {
  const luminances = [relativeLuminance(first), relativeLuminance(second)];
  const lighter = Math.max(...luminances);
  const darker = Math.min(...luminances);

  return (lighter + FLARE) / (darker + FLARE);
}

function contrastPairs(): ContrastPair[] {
  const textOnSurfaces = TEXT_ON_ANY_SURFACE.flatMap((text) =>
    SURFACES.map((surface) => ({ text, surface, minimum: TEXT_CONTRAST })),
  );
  const textOnFills = FILLS.map((fill) => ({ text: `${fill}-foreground`, surface: fill, minimum: TEXT_CONTRAST }));
  const edges = EDGES.flatMap((edge) =>
    SURFACES.map((surface) => ({ text: edge, surface, minimum: NON_TEXT_CONTRAST })),
  );

  const chartMarks = CHART_MARKS.map((mark) => ({ text: mark, surface: CHART_SURFACE, minimum: NON_TEXT_CONTRAST }));

  return [...textOnSurfaces, ...textOnFills, ...edges, ...chartMarks];
}

describe.each(Object.entries(THEME_SELECTORS))('the %s theme', (_theme, selector) => {
  const variables = themeVariables(selector);

  it.each(contrastPairs())('$text on $surface reaches $minimum:1', ({ text, surface, minimum }) => {
    expect(contrastRatio(variables[text], variables[surface])).toBeGreaterThanOrEqual(minimum);
  });
});
