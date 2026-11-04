type Props = {
  // Only when the logo stands alone. Next to the app name it is decorative, so screen readers skip it.
  label?: string;
};

const SIZE_PX = 32;

// The favicon itself, so the header mark, the browser tab and the PWA icons are always the same drawing.
const LOGO_URL = `${import.meta.env.BASE_URL}favicon.svg`;

// The app logo: an odometer window reading 0427, the last wheel in the app's blue.
function Logo({ label = '' }: Props) {
  return <img src={LOGO_URL} alt={label} width={SIZE_PX} height={SIZE_PX} className="shrink-0" />;
}

export default Logo;
