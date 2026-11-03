import { ChevronDownIcon, type LucideIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@components/ui/button';
import { cn } from '@utils/classNameUtils';
import PhotoFrame from '../../PhotoFrame';

type Props = {
  label: string;
  Icon: LucideIcon;
  photoUrl: string;
  photoDescription: string;
};

// A button that shows the photo under it, and hides it again. The photo only loads the first time it is asked for,
// then stays mounted so hiding it can slide shut too. The space opens and closes smoothly (a grid row growing from
// 0fr to 1fr), and the photo fades in once it has loaded; both are instant when the system asks for reduced motion.
// While hidden it is `inert`, so neither the keyboard nor a screen reader reaches it. `aria-expanded` tells a screen
// reader whether it is showing.
function PhotoReveal({ label, Icon, photoUrl, photoDescription }: Props) {
  const [isShowing, setIsShowing] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const photoId = useId();

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={isShowing}
        aria-controls={photoId}
        onClick={() => {
          setHasOpened(true);
          setIsShowing((wasShowing) => !wasShowing);
        }}
        className="self-start"
      >
        <Icon aria-hidden="true" />
        {label}
        <ChevronDownIcon aria-hidden="true" className={cn('transition-transform', isShowing && 'rotate-180')} />
      </Button>
      <div
        id={photoId}
        inert={!isShowing}
        className={cn(
          'grid motion-safe:transition-[grid-template-rows,opacity] motion-safe:duration-300 motion-safe:ease-out',
          isShowing ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {hasOpened && <PhotoFrame photoUrl={photoUrl} photoDescription={photoDescription} className="w-full" />}
        </div>
      </div>
    </div>
  );
}

export default PhotoReveal;
