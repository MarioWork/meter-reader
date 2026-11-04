import { Navigate, useAsyncError } from 'react-router';
import { isNotFoundFailure, isUnauthorizedFailure } from '@api/axiosActions';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import ReadingNotFound from '../ReadingNotFound';

// The reading did not load. Not there (deleted, an old link), the page says so; a lost session goes to the login
// page, as everywhere else in the app; anything else is thrown on to the app's error page, which offers Try again.
function ReadingLoadFailure() {
  const error = useAsyncError();

  if (isNotFoundFailure(error)) return <ReadingNotFound />;

  if (isUnauthorizedFailure(error)) return <Navigate to={AUTH_ROUTES_PATHS.LOGIN} replace />;

  throw error;
}

export default ReadingLoadFailure;
