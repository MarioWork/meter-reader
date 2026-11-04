import { cn } from '@utils/classNameUtils';

type Props = {
  className?: string;
};

// One wheel's strip: 0 to 9, then 0 again, so the end of a roll looks the same as its start and the loop has no jump.
const WHEEL_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

// Left to right, slow to fast, as on a meter: the last wheel turns most.
const WHEEL_ANIMATIONS = [
  'motion-safe:animate-digit-roll-slow',
  'motion-safe:animate-digit-roll',
  'motion-safe:animate-digit-roll-fast',
];

type WheelProps = {
  animation: string;
};

// One wheel of the meter: a window one digit tall, the strip rolling up behind it.
function DigitWheel({ animation }: WheelProps) {
  return (
    <span className="h-[1em] overflow-hidden">
      <span className={cn('flex flex-col', animation)}>
        {WHEEL_DIGITS.map((digit, index) => (
          <span key={index} className="h-[1em]">
            {digit}
          </span>
        ))}
      </span>
    </span>
  );
}

// The app's loading sign: a little water meter, its three wheels rolling. It only shows that work is going on, so it
// is hidden from screen readers: the text beside it, or the control it sits in, says what is loading. With reduced
// motion the wheels stand still and the meter fades in and out instead. Sized in em, it follows the text around it.
function LoadingDigits({ className }: Props) {
  return (
    <span
      aria-hidden="true"
      data-slot="loading-digits"
      className={cn(
        'inline-flex shrink-0 rounded-sm border border-current/40 px-0.5 font-mono text-xs leading-none tabular-nums motion-reduce:animate-pulse',
        className,
      )}
    >
      {WHEEL_ANIMATIONS.map((animation) => (
        <DigitWheel key={animation} animation={animation} />
      ))}
    </span>
  );
}

export default LoadingDigits;
