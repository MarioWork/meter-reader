import type { LucideIcon } from 'lucide-react';

type Props = {
  title: string;
  // The page's icon, as in the sidebar.
  Icon: LucideIcon;
  description?: string;
};

// A wide screen's page title: the page's icon in a tinted square, then the one
// h1 over an optional one-line description.
function PageTitle({ title, Icon, description }: Props) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary lg:size-10"
      >
        <Icon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance lg:text-3xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

export default PageTitle;
