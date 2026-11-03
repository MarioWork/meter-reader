import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  FoldHorizontalIcon,
  FoldVerticalIcon,
  RotateCcwIcon,
  RotateCwIcon,
  UnfoldHorizontalIcon,
  UnfoldVerticalIcon,
} from 'lucide-react';
import { Button } from '@components/ui/button';
import type { BoxSizeChange, CropPoint } from '../../../../../types';
import type { CropButton } from '../types';
import CropButtonGroup from './CropButtonGroup';

type Props = {
  onTurnLeft: () => void;
  onTurnRight: () => void;
  onMove: (by: CropPoint) => void;
  onResize: (by: BoxSizeChange) => void;
};

// One click moves or sizes the box by a twentieth of the photo.
const STEP = 0.05;

// Rotate left and Rotate right turn the photo a quarter each way; the arrows move the box and the fold buttons size
// it, one step per click. Everything a drag on the photo does, without dragging.
function CropControls({ onTurnLeft, onTurnRight, onMove, onResize }: Props) {
  const moveButtons: CropButton[] = [
    { label: 'Move box left', icon: ArrowLeftIcon, onClick: () => onMove({ x: -STEP, y: 0 }) },
    { label: 'Move box up', icon: ArrowUpIcon, onClick: () => onMove({ x: 0, y: -STEP }) },
    { label: 'Move box down', icon: ArrowDownIcon, onClick: () => onMove({ x: 0, y: STEP }) },
    { label: 'Move box right', icon: ArrowRightIcon, onClick: () => onMove({ x: STEP, y: 0 }) },
  ];

  const sizeButtons: CropButton[] = [
    { label: 'Make box narrower', icon: FoldHorizontalIcon, onClick: () => onResize({ width: -STEP, height: 0 }) },
    { label: 'Make box wider', icon: UnfoldHorizontalIcon, onClick: () => onResize({ width: STEP, height: 0 }) },
    { label: 'Make box shorter', icon: FoldVerticalIcon, onClick: () => onResize({ width: 0, height: -STEP }) },
    { label: 'Make box taller', icon: UnfoldVerticalIcon, onClick: () => onResize({ width: 0, height: STEP }) },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="lg" onClick={onTurnLeft}>
        <RotateCcwIcon data-icon="inline-start" aria-hidden />
        Rotate left
      </Button>
      <Button variant="outline" size="lg" onClick={onTurnRight}>
        <RotateCwIcon data-icon="inline-start" aria-hidden />
        Rotate right
      </Button>
      <CropButtonGroup label="Move the box" buttons={moveButtons} />
      <CropButtonGroup label="Size the box" buttons={sizeButtons} />
    </div>
  );
}

export default CropControls;
