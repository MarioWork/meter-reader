type Props = {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary';
  isDisabled?: boolean;
  // A fuller name for screen readers when the visible text alone is ambiguous (a "Delete" on every row). It must
  // start with the visible text (WCAG 2.5.3, label in name).
  ariaLabel?: string;
  onClick?: () => void;
};

const BASE_CLASSES = `
  min-h-6 self-start rounded-sm px-3 py-1
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700
  disabled:opacity-60
`;

const VARIANT_CLASSES: Record<NonNullable<Props['variant']>, string> = {
  primary: `${BASE_CLASSES} bg-blue-700 text-white`,
  secondary: `${BASE_CLASSES} border border-blue-700 bg-white text-blue-700`,
};

// The app's one button: at least 24×24 px (WCAG 2.2 target size) and a visible keyboard focus ring.
function Button({ children, type = 'button', variant = 'primary', isDisabled = false, ariaLabel, onClick }: Props) {
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-label={ariaLabel}
      onClick={onClick}
      className={VARIANT_CLASSES[variant]}
    >
      {children}
    </button>
  );
}

export default Button;
