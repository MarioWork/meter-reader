import { Link, useLocation } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { ReadingApiModel } from '@app-types/models';
import { formatIsoDate } from '@utils/dateUtils';

type Props = {
  reading: ReadingApiModel;
};

// Stretched over the whole card, so a tap anywhere on it opens the details. The card's own buttons sit above it
// (z-10), so they still get their taps. A link, as it goes somewhere; its name includes the date the card shows.
function ReadingDetailsLink({ reading }: Props) {
  const { search } = useLocation();

  return (
    <Link
      to={{ pathname: READING_ROUTES_PATHS.details(String(reading.id)), search }}
      aria-label={`Details of the ${formatIsoDate(reading.date)} reading`}
      className="absolute inset-0 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    />
  );
}

export default ReadingDetailsLink;
