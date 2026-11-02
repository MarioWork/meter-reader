import { Link, type To } from 'react-router';

type Props = {
  to: To;
  children: React.ReactNode;
  variant?: 'text' | 'primary';
};

const FOCUS_RING_CLASSES = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700';

const VARIANT_CLASSES: Record<NonNullable<Props['variant']>, string> = {
  text: `min-h-6 self-start rounded-sm text-blue-700 underline ${FOCUS_RING_CLASSES}`,
  primary: `
    self-stretch rounded-md bg-blue-700 px-6 py-4 text-center text-xl font-semibold text-white ${FOCUS_RING_CLASSES}
  `,
};

// The app's one link: it goes somewhere (buttons do things). `primary` is the big call to action. Both keep a
// visible keyboard focus ring and a target of at least 24 px.
function TextLink({ to, children, variant = 'text' }: Props) {
  return (
    <Link to={to} className={VARIANT_CLASSES[variant]}>
      {children}
    </Link>
  );
}

export default TextLink;
