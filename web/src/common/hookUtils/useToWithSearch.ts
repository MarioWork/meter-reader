import { useLocation, type To } from 'react-router';

// Where a link goes, keeping this page's search: Home's filters and pages of the history ride along in it, so every
// way back finds the same history.
export function useToWithSearch(pathname: string): To {
  const { search } = useLocation();

  return { pathname, search };
}
