import { useId, type ReactNode } from 'react';
import { cn } from '@utils/classNameUtils';

type Props = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

// One part of a Settings card, a step below it: a smaller heading, a line on what it is for, then its content. A
// section named by its heading, so it is a region of its own, found by its name.
function SettingsSection({ title, description, children, className }: Props) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-col gap-1">
        <h3 id={titleId} className="font-medium">
          {title}
        </h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default SettingsSection;
