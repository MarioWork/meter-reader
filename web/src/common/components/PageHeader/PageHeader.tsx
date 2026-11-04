import type { LucideIcon } from 'lucide-react';
import { useIsWideScreen } from '@hooks/useIsWideScreen';
import PageTitle from './components/PageTitle';

type Props = {
  title: string;
  // The page's icon, as in the sidebar; shown on a wide screen only.
  Icon: LucideIcon;
  // One muted line under the title, on a wide screen only.
  description?: string;
  // On the title's right: the page's links and buttons.
  actions?: React.ReactNode;
};

// The page's one h1 with its actions on the right. A phone keeps it plain. A wide screen shows it at the top of the
// page's first tile: the page's icon beside the title, and the description under it.
function PageHeader({ title, Icon, description, actions }: Props) {
  const isWideScreen = useIsWideScreen();

  if (!isWideScreen) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        {actions}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <PageTitle title={title} Icon={Icon} description={description} />
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

export default PageHeader;
