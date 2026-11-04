import { Link } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import { PlusIcon } from 'lucide-react';
import { buttonVariants } from '@components/ui/button';
import { cn } from '@utils/classNameUtils';

const NEW_READING_LABEL = 'New';
// The short label alone says little to a screen reader, so the link's name says what it makes.
const NEW_READING_NAME = 'New reading';

// A phone's New reading, always in reach of a thumb: full width, stuck to the bottom of the screen. It is the last
// thing in the page, so at the end of the history it sits below the last card instead of over it. It opens the New
// reading page; a wider screen has New reading at the top instead (NewReadingLink).
function NewReadingBar() {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 p-4 backdrop-blur-sm">
      <Link
        to={READING_ROUTES_PATHS.NEW}
        aria-label={NEW_READING_NAME}
        className={cn(buttonVariants({ size: 'lg' }), 'h-12 w-full text-base')}
      >
        <PlusIcon data-icon="inline-start" aria-hidden="true" />
        {NEW_READING_LABEL}
      </Link>
    </div>
  );
}

export default NewReadingBar;
