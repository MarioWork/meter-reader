import { useId, type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';

type Props = {
  title: string;
  description: string;
  children: ReactNode;
};

// One card of Settings: a heading that names it, a line on what it is for, then its content. Card is a div, so the
// role makes it a named section of the page, reachable by its heading or as a region.
function SettingsCard({ title, description, children }: Props) {
  const titleId = useId();

  return (
    <Card role="region" aria-labelledby={titleId}>
      <CardHeader>
        <CardTitle>
          <h2 id={titleId}>{title}</h2>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

export default SettingsCard;
