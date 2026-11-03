import { Button } from '@components/ui/button';
import type { CropButton } from '../types';

type Props = {
  label: string;
  buttons: CropButton[];
};

// A row of icon buttons that move or size the box one step per click, the single-click and keyboard way to do what
// dragging does. Each button is named by its label; the icon is only a picture of it. 32 px, above the 24 px minimum.
function CropButtonGroup({ label, buttons }: Props) {
  return (
    <div role="group" aria-label={label} className="flex gap-1">
      {buttons.map(({ label: buttonLabel, icon: Icon, onClick }) => (
        <Button
          key={buttonLabel}
          variant="outline"
          size="icon"
          aria-label={buttonLabel}
          title={buttonLabel}
          onClick={onClick}
        >
          <Icon aria-hidden />
        </Button>
      ))}
    </div>
  );
}

export default CropButtonGroup;
