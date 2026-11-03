import { CameraIcon } from 'lucide-react';
import { Link } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import { buttonVariants } from '@components/ui/button';
import { useIsWideScreen } from '@hooks/useIsWideScreen';
import { cn } from '@utils/classNameUtils';

const NEW_READING_LABEL = 'New reading';

// Always in reach of a thumb: full width, stuck to the bottom of the screen. It is the last thing in the page, so at
// the end of the history it sits below the last card instead of over it. A phone opens the New reading page; a wider
// screen opens it as a modal over the history.
function NewReadingBar() {
  const isWideScreen = useIsWideScreen();
  const newReadingPath = isWideScreen ? READING_ROUTES_PATHS.NEW_MODAL : READING_ROUTES_PATHS.NEW;

  return (
    <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 p-4 backdrop-blur-sm">
      <Link to={newReadingPath} className={cn(buttonVariants({ size: 'lg' }), 'h-12 w-full text-base')}>
        <CameraIcon data-icon="inline-start" />
        {NEW_READING_LABEL}
      </Link>
    </div>
  );
}

export default NewReadingBar;
