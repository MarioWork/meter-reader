import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Link, useLocation, type To } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { ReadingNeighbourApiModel } from '@app-types/models';
import { buttonVariants } from '@components/ui/button';
import { cn } from '@utils/classNameUtils';
import { useReading } from '../../../hooks/useReading';
import { useArrowKeysBetweenReadings } from '../hooks/useArrowKeysBetweenReadings';

const NAV_LABEL = 'Other readings';
const PREVIOUS_LABEL = 'Previous';
const NEXT_LABEL = 'Next';

const LINK_CLASS_NAME = buttonVariants({ variant: 'ghost', size: 'lg' });

// The neighbour's page, with Home's search riding along like every other way off this page; null at that end.
function toNeighbourPage(neighbour: ReadingNeighbourApiModel | null, search: string): To | null {
  if (!neighbour) return null;

  return { pathname: READING_ROUTES_PATHS.details(String(neighbour.id)), search };
}

// "‹ Previous" and "Next ›": the readings just before and after this one by date, and the ← and → keys to them. Each is
// left out at its end of the history, so Next always stays on the right.
function ReadingNeighbourLinks() {
  const { previous, next } = useReading();
  const { search } = useLocation();
  const previousTo = toNeighbourPage(previous, search);
  const nextTo = toNeighbourPage(next, search);

  useArrowKeysBetweenReadings({ previousTo, nextTo });

  const isOnlyReading = !previousTo && !nextTo;

  if (isOnlyReading) return null;

  return (
    <nav aria-label={NAV_LABEL} className="-mx-2.5 flex items-center justify-between gap-2">
      {previousTo && (
        <Link to={previousTo} className={LINK_CLASS_NAME}>
          <ChevronLeftIcon aria-hidden="true" data-icon="inline-start" />
          {PREVIOUS_LABEL}
        </Link>
      )}
      {nextTo && (
        <Link to={nextTo} className={cn(LINK_CLASS_NAME, 'ml-auto')}>
          {NEXT_LABEL}
          <ChevronRightIcon aria-hidden="true" data-icon="inline-end" />
        </Link>
      )}
    </nav>
  );
}

export default ReadingNeighbourLinks;
