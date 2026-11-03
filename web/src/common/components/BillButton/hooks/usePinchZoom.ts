import { useRef } from 'react';

type PinchStart = {
  distance: number;
  zoom: number;
};

const PINCH_FINGERS = 2;

function distanceBetweenFingers(touches: React.TouchList): number {
  const first = touches[0];
  const second = touches[1];

  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
}

// Two fingers moving apart zoom in, together zoom out, from the zoom the pinch started at. Touch events rather than
// pointer events: the browser keeps sending them while it scrolls with the same fingers. The element they go on sets
// touch-action to pan only, so the browser scrolls it but leaves the pinch to this hook.
export function usePinchZoom(zoom: number, onPinch: (zoom: number) => void, onPinchEnd: () => void) {
  const pinchStartRef = useRef<PinchStart>(undefined);

  const onTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length !== PINCH_FINGERS) return;

    pinchStartRef.current = { distance: distanceBetweenFingers(event.touches), zoom };
  };

  const onTouchMove = (event: React.TouchEvent) => {
    const pinchStart = pinchStartRef.current;

    if (!pinchStart || event.touches.length !== PINCH_FINGERS) return;

    onPinch((pinchStart.zoom * distanceBetweenFingers(event.touches)) / pinchStart.distance);
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const isPinching = pinchStartRef.current !== undefined;
    const isFingerLifted = event.touches.length < PINCH_FINGERS;

    if (!isPinching || !isFingerLifted) return;

    pinchStartRef.current = undefined;
    onPinchEnd();
  };

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd };
}
