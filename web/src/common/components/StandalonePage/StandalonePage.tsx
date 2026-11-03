import type { ReactNode } from 'react';
import StandaloneBackdrop from './components/StandaloneBackdrop';
import StandaloneCard from './components/StandaloneCard';

type Props = {
  title: string;
  description?: string;
  // Small print under the card: help, a way out.
  footer?: ReactNode;
  children?: ReactNode;
};

// A page outside the signed-in layout (login, setup): one centred card with the floating logo, the page's h1 and its
// content, over two soft glows. Phone first: a 16px gutter, and the card never grows past a comfortable width.
function StandalonePage({ title, description, footer, children }: Props) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <StandaloneBackdrop />
      <main className="relative flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
        <StandaloneCard title={title} description={description}>
          {children}
        </StandaloneCard>
        {footer && <div className="w-full max-w-sm text-center text-xs text-muted-foreground">{footer}</div>}
      </main>
    </div>
  );
}

export default StandalonePage;
