# Assets

Brand images made for the app, kept here as standalone files.

| File | What |
| --- | --- |
| `logos/meter-reader-logo.svg` | The logo: an odometer window reading 0427, the last wheel in the app's blue. |
| `meter-not-found-{light,dark}.svg` | The meter mascot, puzzled, with a question mark and a magnifying glass: a page that is not there (404). |
| `meter-broken-{light,dark}.svg` | The meter mascot, dizzy, with crossed eyes and twinkles: a page that broke on the way in. |
| `meter-empty-{light,dark}.svg` | A blank meter window with a search badge: a search or filter that found nothing. |
| `meter-loading-{light,dark}.svg` | Three meter wheels rolling up, slow to fast: the app's loading sign. Animated; stands still with reduced motion. |

The logo is a copy of `web/public/favicon.svg`, which is what the app serves; change both together.

The app draws the others itself, in the theme's colours: the mascot from
`web/src/pages/Error/RouteError/components/MeterMascot.tsx`, the empty meter from
`web/src/common/components/EmptyMeter`, and the loading wheels from `web/src/common/components/LoadingDigits`. These
SVGs are fixed-colour copies (the app's colours, `web/src/index.css`) for use outside the app. If a
drawing changes, regenerate them to match.
