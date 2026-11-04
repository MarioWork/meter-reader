import { CameraIcon } from 'lucide-react';
import { Link } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import { buttonVariants } from '@components/ui/button';

const NEW_READING_LABEL = 'New reading';

// A wide screen's New reading, beside Export at the top of Home. It opens New reading as a modal over the history.
function NewReadingLink() {
  return (
    <Link to={READING_ROUTES_PATHS.NEW_MODAL} className={buttonVariants()}>
      <CameraIcon data-icon="inline-start" aria-hidden="true" />
      {NEW_READING_LABEL}
    </Link>
  );
}

export default NewReadingLink;
