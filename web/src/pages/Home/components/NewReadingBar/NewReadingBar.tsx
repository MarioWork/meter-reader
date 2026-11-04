import { Link } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import { PlusIcon } from 'lucide-react';
import { buttonVariants } from '@components/ui/button';
import { cn } from '@utils/classNameUtils';

// An icon alone, so the link's name says what it makes.
const NEW_READING_NAME = 'New reading';

// A phone's New reading, always in reach of a thumb: a round floating action button with a plus, 56 px across, in the
// bottom-right corner, over the history, clear of the phone's home bar. Home leaves room under the history for it, so the last card scrolls above
// it, and a focused control scrolled to the bottom stays in view (WCAG 2.4.11). It opens the New reading page; a
// wider screen has New reading at the top instead (NewReadingLink).
function NewReadingBar() {
  return (
    <Link
      to={READING_ROUTES_PATHS.NEW}
      aria-label={NEW_READING_NAME}
      className={cn(
        buttonVariants({ size: 'lg' }),
        'fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 size-14 rounded-full shadow-lg [&_svg]:size-6',
      )}
    >
      <PlusIcon aria-hidden="true" />
    </Link>
  );
}

export default NewReadingBar;
