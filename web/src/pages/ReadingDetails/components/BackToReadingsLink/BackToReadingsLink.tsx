import { ArrowLeftIcon, ChevronLeftIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { buttonVariants } from '@components/ui/button';
import { cn } from '@utils/classNameUtils';
import { backPageOf } from '@utils/readingBackUtils';

type Props = {
  // Beside the reading's title: a chevron alone, named for screen readers.
  isIcon?: boolean;
};

// Back to the list the reading was opened from, Home or Costs, with the same filters and pages it had: they ride
// along in this page's search (readingBackUtils). As an icon, 36 px square, over the 24 px minimum target.
function BackToReadingsLink({ isIcon = false }: Props) {
  const { search } = useLocation();
  const { to, label, iconLabel } = backPageOf(search);

  if (isIcon) {
    return (
      <Link
        to={to}
        aria-label={iconLabel}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon-lg' }), '-ml-2 shrink-0')}
      >
        <ChevronLeftIcon aria-hidden="true" className="size-6" />
      </Link>
    );
  }

  return (
    <Link to={to} className={cn(buttonVariants({ variant: 'ghost' }), '-ml-2.5 self-start text-muted-foreground')}>
      <ArrowLeftIcon aria-hidden="true" />
      {label}
    </Link>
  );
}

export default BackToReadingsLink;
