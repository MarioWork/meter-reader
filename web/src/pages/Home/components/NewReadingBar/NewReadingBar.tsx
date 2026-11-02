import { CameraIcon } from 'lucide-react';
import { Link } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import { buttonVariants } from '@components/ui/button';
import { cn } from '@utils/classNameUtils';

const NEW_READING_LABEL = 'New reading';

// Always in reach of a thumb: full width, stuck to the bottom of the screen. It is the last thing in the page, so at
// the end of the history it sits below the last card instead of over it.
function NewReadingBar() {
  return (
    <div className="sticky bottom-0 -mx-4 border-t bg-background/95 p-4 backdrop-blur-sm">
      <Link to={READING_ROUTES_PATHS.NEW} className={cn(buttonVariants({ size: 'lg' }), 'h-12 w-full text-base')}>
        <CameraIcon data-icon="inline-start" />
        {NEW_READING_LABEL}
      </Link>
    </div>
  );
}

export default NewReadingBar;
