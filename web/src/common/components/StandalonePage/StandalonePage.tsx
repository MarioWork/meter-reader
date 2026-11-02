import type { ReactNode } from 'react';
import Logo from '@components/Logo';
import { Card, CardContent } from '@components/ui/card';
import StandalonePageHeader from './components/StandalonePageHeader';

type Props = {
  title: string;
  description?: string;
  children?: ReactNode;
};

const APP_NAME = 'Meter Reader';

// A page outside the signed-in layout (login, setup, error): the logo and app name over one centred card, phone
// first.
function StandalonePage({ title, description, children }: Props) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <p className="flex items-center gap-2 text-lg font-semibold">
        <Logo />
        {APP_NAME}
      </p>
      <Card className="w-full max-w-sm">
        <StandalonePageHeader title={title} description={description} />
        {children && <CardContent className="flex flex-col gap-6">{children}</CardContent>}
      </Card>
    </main>
  );
}

export default StandalonePage;
