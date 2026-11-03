import { useRef } from 'react';
import { boxBetween, isInsideBox, moveBox, moveBoxMiddleTo } from '../../../../../photoCropUtils';
import type { CropBox, CropPoint } from '../../../../../types';

// A drag that starts on the box moves it; one that starts anywhere else on the photo draws a new box.
const DragMode = {
  MOVE: 'move',
  DRAW: 'draw',
} as const;

type DragMode = (typeof DragMode)[keyof typeof DragMode];

type Drag = { mode: DragMode; start: CropPoint; startBox: CropBox; hasMoved: boolean };

type BoxForDrag = (drag: Drag, point: CropPoint) => CropBox;

type OnBoxChange = (box: CropBox) => void;

// Less than this far (a fraction of the frame) is a tap, not a drag: a finger always wobbles a little.
const TAP_DISTANCE = 0.02;

const BOX_FOR_DRAG: Record<DragMode, BoxForDrag> = {
  [DragMode.MOVE]: ({ start, startBox }, point) => moveBox(startBox, { x: point.x - start.x, y: point.y - start.y }),
  [DragMode.DRAW]: ({ start }, point) => boxBetween(start, point),
};

// Where the pointer is on the frame, as fractions of the frame's width and height.
function pointOnFrame(event: React.PointerEvent<HTMLElement>): CropPoint {
  const frame = event.currentTarget.getBoundingClientRect();

  return { x: (event.clientX - frame.left) / frame.width, y: (event.clientY - frame.top) / frame.height };
}

function isPastTapDistance(start: CropPoint, point: CropPoint): boolean {
  return Math.abs(point.x - start.x) > TAP_DISTANCE || Math.abs(point.y - start.y) > TAP_DISTANCE;
}

// Drawing and moving the box with a finger or a mouse, on the frame the turned photo fills. A tap off the box moves
// the box there, so one tap is enough to place it. The pointer is captured, so a drag that leaves the frame still
// ends. The crop buttons do the same with single clicks or the keyboard.
export function useCropDrag(box: CropBox, onBoxChange: OnBoxChange) {
  const drag = useRef<Drag>(undefined);

  function startDrag(event: React.PointerEvent<HTMLElement>) {
    const start = pointOnFrame(event);
    const mode = isInsideBox(start, box) ? DragMode.MOVE : DragMode.DRAW;

    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { mode, start, startBox: box, hasMoved: false };
  }

  function followDrag(event: React.PointerEvent<HTMLElement>) {
    const current = drag.current;

    if (!current) return;

    const point = pointOnFrame(event);

    current.hasMoved ||= isPastTapDistance(current.start, point);

    if (current.hasMoved) onBoxChange(BOX_FOR_DRAG[current.mode](current, point));
  }

  function endDrag() {
    const current = drag.current;
    const isTapOffTheBox = current !== undefined && !current.hasMoved && current.mode === DragMode.DRAW;

    if (isTapOffTheBox) onBoxChange(moveBoxMiddleTo(current.startBox, current.start));

    drag.current = undefined;
  }

  function cancelDrag() {
    drag.current = undefined;
  }

  return { onPointerDown: startDrag, onPointerMove: followDrag, onPointerUp: endDrag, onPointerCancel: cancelDrag };
}
