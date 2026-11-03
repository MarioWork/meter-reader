import { useState } from 'react';
import { cn } from '@utils/classNameUtils';

type Props = {
  isOpen: boolean;
  // So a toggle can point at it with aria-controls.
  id?: string;
  children: React.ReactNode;
};

// Opens and closes its content smoothly instead of popping it in and out: a grid row grows from 0fr to 1fr while the
// content fades, and both are instant when the system asks for reduced motion. The content mounts the first time it
// opens (a photo only loads when asked for), then stays, so closing can slide shut too. While closed it is `inert`:
// neither the keyboard nor a screen reader reaches it.
function SmoothReveal({ isOpen, id, children }: Props) {
  const [hasOpened, setHasOpened] = useState(isOpen);

  if (isOpen && !hasOpened) setHasOpened(true);

  return (
    <div
      id={id}
      inert={!isOpen}
      className={cn(
        'grid motion-safe:transition-[grid-template-rows,opacity] motion-safe:duration-300 motion-safe:ease-out',
        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
      )}
    >
      <div className="min-h-0 overflow-hidden">{hasOpened && children}</div>
    </div>
  );
}

export default SmoothReveal;
