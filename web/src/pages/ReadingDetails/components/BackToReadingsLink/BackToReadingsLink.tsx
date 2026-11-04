import { ArrowLeftIcon } from 'lucide-react';
import { Link } from 'react-router';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { buttonVariants } from '@components/ui/button';
import { useToWithSearch } from '@hooks/useToWithSearch';
import { cn } from '@utils/classNameUtils';

const LABEL = 'Readings';

// Back to Home with the same filters and pages of the history the reading was opened from: they ride along in this
// page's search.
function BackToReadingsLink() {
  const backToReadings = useToWithSearch(BASE_ROUTES_PATHS.HOME);

  return (
    <Link
      to={backToReadings}
      className={cn(buttonVariants({ variant: 'ghost' }), '-ml-2.5 self-start text-muted-foreground')}
    >
      <ArrowLeftIcon aria-hidden="true" />
      {LABEL}
    </Link>
  );
}

export default BackToReadingsLink;
