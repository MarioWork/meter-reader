import type { ReactNode } from 'react';
import FloatingLogo from './FloatingLogo';

type Props = {
  title: string;
  description?: string;
  children?: ReactNode;
};

const ENTER_CLASSES =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200';

// The card itself: the floating logo, the page's one h1 with its line of copy, then the page's content.
function StandaloneCard({ title, description, children }: Props) {
  return (
    <section
      className={`flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl bg-card px-5 py-8 text-center shadow-xl ring-1 shadow-primary/5 ring-foreground/10 sm:px-8 ${ENTER_CLASSES}`}
    >
      <FloatingLogo />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-balance">{title}</h1>
        {description && <p className="text-sm text-balance text-muted-foreground">{description}</p>}
      </header>
      {children && <div className="flex w-full flex-col gap-4 text-left">{children}</div>}
    </section>
  );
}

export default StandaloneCard;
