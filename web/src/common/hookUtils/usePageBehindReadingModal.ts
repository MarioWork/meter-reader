import { useLocation, useParams, type To } from 'react-router';
import { pageBehindReadingModal } from '@utils/readingModalUtils';

// Where a reading's modal goes when it closes: back to the page it opened over, with the same search.
export function usePageBehindReadingModal(): To {
  const { pathname, search } = useLocation();
  const { readingId = '' } = useParams();

  return { pathname: pageBehindReadingModal(pathname, readingId), search };
}
