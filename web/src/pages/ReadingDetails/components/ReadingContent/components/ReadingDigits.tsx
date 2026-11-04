type Props = {
  digits: string;
};

const LABEL = 'Reading';
const UNIT = 'm³';
const UNIT_NAME = 'cubic metres';

// The page's hero: the digits exactly as the meter shows them, big and monospaced, with the unit beside them.
function ReadingDigits({ digits }: Props) {
  return (
    <p className="flex items-baseline gap-2">
      <span className="sr-only">{LABEL}</span>
      <span className="font-mono text-5xl font-semibold tracking-wider tabular-nums sm:text-6xl">{digits}</span>
      <abbr title={UNIT_NAME} className="text-2xl text-muted-foreground no-underline">
        {UNIT}
      </abbr>
    </p>
  );
}

export default ReadingDigits;
