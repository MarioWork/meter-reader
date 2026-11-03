import type { RouteErrorKind } from '../routeErrorUtils';

type Props = {
  pose: RouteErrorKind;
  className?: string;
};

type Pose = {
  // What the mascot's own digit window reads.
  digits: string;
  Face: () => React.ReactNode;
};

// Puzzled: round eyes, a wobbly mouth, a question mark, and a magnifying glass (the primary colour) looking for the page.
function PuzzledFace() {
  return (
    <>
      <circle cx="35" cy="37" r="3.5" fill="currentColor" stroke="none" />
      <circle cx="53" cy="37" r="3.5" fill="currentColor" stroke="none" />
      <path d="M39 46q2.5 -2.5 5 0t5 0" strokeWidth="2.5" />
      <path d="M76 8a6 6 0 1 1 7 6q-2.5 1-2.5 4.5" strokeWidth="3" />
      <circle cx="80.5" cy="24" r="1.8" fill="currentColor" stroke="none" />
      <g className="text-primary">
        <circle cx="80" cy="74" r="8" strokeWidth="3" />
        <path d="M74.5 80 68 87" strokeWidth="4" />
      </g>
    </>
  );
}

// Dizzy: crossed eyes, a little "o" of a mouth, and a drop (the primary colour) leaking from its pipe.
function DizzyFace() {
  return (
    <>
      <path d="M32 34l6 6m0 -6l-6 6M50 34l6 6m0 -6l-6 6" strokeWidth="2.5" />
      <circle cx="44" cy="47" r="2.5" strokeWidth="2.5" />
      <path className="text-primary" d="M86 55q-4.5 5.5 0 8.5q4.5 -3 0 -8.5z" strokeWidth="2.5" />
    </>
  );
}

const POSE_MAP: Record<RouteErrorKind, Pose> = {
  notFound: { digits: '404', Face: PuzzledFace },
  broken: { digits: '000', Face: DizzyFace },
};

// The app's water meter as a little character, in dashed line art: a round body with a pipe on each side, rosy
// cheeks, its digit window, and a face that matches what went wrong. Decorative: the page's text says it all.
function MeterMascot({ pose, className }: Props) {
  const { digits, Face } = POSE_MAP[pose];

  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="44" cy="44" r="28" strokeWidth="3" strokeDasharray="6 5" />
      <path d="M6 44h10M72 44h10M6 38v12M82 38v12" strokeWidth="3" />
      <g className="text-primary opacity-40" fill="currentColor" stroke="none">
        <ellipse cx="29" cy="45" rx="3.5" ry="2" />
        <ellipse cx="59" cy="45" rx="3.5" ry="2" />
      </g>
      <rect x="31" y="54" width="26" height="10" rx="2.5" strokeWidth="2.5" />
      <text
        x="44"
        y="61.5"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="700"
        letterSpacing="1"
        fill="currentColor"
        stroke="none"
        className="font-mono"
      >
        {digits}
      </text>
      <Face />
    </svg>
  );
}

export default MeterMascot;
