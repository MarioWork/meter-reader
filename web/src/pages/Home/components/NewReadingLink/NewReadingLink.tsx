import { Link } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import { PlusIcon } from 'lucide-react';
import { buttonVariants } from '@components/ui/button';

const NEW_READING_LABEL = 'New';
// The short label alone says little to a screen reader, so the link's name says what it makes.
const NEW_READING_NAME = 'New reading';

// A wide screen's New reading, beside Export at the top of Home. It opens New reading as a modal over the history.
function NewReadingLink() {
  return (
    <Link to={READING_ROUTES_PATHS.NEW_MODAL} aria-label={NEW_READING_NAME} className={buttonVariants()}>
      <PlusIcon data-icon="inline-start" aria-hidden="true" />
      {NEW_READING_LABEL}
    </Link>
  );
}

export default NewReadingLink;
