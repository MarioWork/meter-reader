import { ChevronDownIcon, type LucideIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@components/ui/button';
import { cn } from '@utils/classNameUtils';
import SmoothReveal from '@components/SmoothReveal';
import PhotoFrame from '../../PhotoFrame';

type Props = {
  label: string;
  Icon: LucideIcon;
  photoUrl: string;
  photoDescription: string;
};

// A button that shows the photo under it, and hides it again, sliding open and shut. The photo only loads the first
// time it is asked for. `aria-expanded` tells a screen reader whether it is showing.
function PhotoReveal({ label, Icon, photoUrl, photoDescription }: Props) {
  const [isShowing, setIsShowing] = useState(false);
  const photoId = useId();

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={isShowing}
        aria-controls={photoId}
        onClick={() => setIsShowing((wasShowing) => !wasShowing)}
        className="self-start"
      >
        <Icon aria-hidden="true" />
        {label}
        <ChevronDownIcon aria-hidden="true" className={cn('transition-transform', isShowing && 'rotate-180')} />
      </Button>
      <SmoothReveal id={photoId} isOpen={isShowing}>
        <PhotoFrame photoUrl={photoUrl} photoDescription={photoDescription} className="w-full" />
      </SmoothReveal>
    </div>
  );
}

export default PhotoReveal;
