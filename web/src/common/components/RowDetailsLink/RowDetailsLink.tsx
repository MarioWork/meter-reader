import { Link, useLocation } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { ReadingApiModel } from '@app-types/models';
import { formatIsoDate } from '@utils/dateUtils';
import { readingSearchFrom } from '@utils/readingBackUtils';

type Props = {
  reading: ReadingApiModel;
};

// Said after the day, so a screen reader's list of links says where each one goes: "1 Oct 2026 reading details".
const DETAILS_SUFFIX = ' reading details';

// The row's day, as the link to its details, with the list's search (and, from Costs, where it was opened from, so
// the way back returns there): a link, as it goes somewhere, so it opens in a new tab too. Its click
// area is stretched over the whole row (the row is `relative`), so a click anywhere on it opens the details; the
// row's own links and buttons sit above it. Its name starts with the day it shows (WCAG 2.5.3).
function RowDetailsLink({ reading }: Props) {
  const { pathname, search } = useLocation();
  const readingDate = formatIsoDate(reading.date);

  return (
    <Link
      to={{ pathname: READING_ROUTES_PATHS.details(String(reading.id)), search: readingSearchFrom(pathname, search) }}
      aria-label={`${readingDate}${DETAILS_SUFFIX}`}
      className="rounded-sm font-medium outline-none after:absolute after:inset-0 after:rounded-sm focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
    >
      {readingDate}
    </Link>
  );
}

export default RowDetailsLink;
