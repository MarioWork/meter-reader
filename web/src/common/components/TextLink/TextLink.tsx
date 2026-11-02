import { Link, type To } from 'react-router';

type Props = {
  to: To;
  children: React.ReactNode;
  variant?: 'text' | 'primary';
  // A fuller name for screen readers when the visible text alone is ambiguous (a "Send" on every row). It must start
  // with the visible text (WCAG 2.5.3, label in name).
  ariaLabel?: string;
};

const FOCUS_RING_CLASSES = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

const VARIANT_CLASSES: Record<NonNullable<Props['variant']>, string> = {
  text: `min-h-6 self-start rounded-sm text-primary underline ${FOCUS_RING_CLASSES}`,
  primary: `
    self-stretch rounded-md bg-primary px-6 py-4 text-center text-xl font-semibold text-primary-foreground ${FOCUS_RING_CLASSES}
  `,
};

// The app's one link: it goes somewhere (buttons do things). `primary` is the big call to action. Both keep a
// visible keyboard focus ring and a target of at least 24 px.
function TextLink({ to, children, variant = 'text', ariaLabel }: Props) {
  return (
    <Link to={to} aria-label={ariaLabel} className={VARIANT_CLASSES[variant]}>
      {children}
    </Link>
  );
}

export default TextLink;
