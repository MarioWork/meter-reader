const LOGO_SIZE_PX = 96;
// The favicon itself, the same drawing as the header mark and the browser tab.
const LOGO_URL = `${import.meta.env.BASE_URL}favicon.svg`;

// The app logo on a soft blue halo, bobbing gently over its own shadow. Still when the system asks for reduced
// motion. Decorative: the page's heading carries the meaning.
function FloatingLogo() {
  return (
    <div className="relative flex flex-col items-center pt-2" aria-hidden="true">
      <div className="absolute top-0 size-32 rounded-full bg-primary/10" />
      <img
        src={LOGO_URL}
        alt=""
        width={LOGO_SIZE_PX}
        height={LOGO_SIZE_PX}
        className="relative size-24 rounded-3xl bg-card p-2 shadow-lg ring-4 ring-card motion-safe:animate-float"
      />
      <div className="mt-3 h-2 w-16 rounded-full bg-foreground/15 blur-[2px] motion-safe:animate-float-shadow" />
    </div>
  );
}

export default FloatingLogo;
