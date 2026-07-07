/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Screen-wide drag-to-spin: pointer down anywhere on the canvas wrapper
 * scrubs time for the whole system (earth rotation + moon orbit).
 */

import { useEffect, type PointerEvent as ReactPointerEvent } from 'react';
import { DRAG_RADIANS_PER_PIXEL } from './scene-constants';
import { beginSpinDrag, spinState } from './spin-state';

export function useSpinDrag() {
  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (!spinState.isDragging) return;
      const deltaX = event.clientX - spinState.lastX;
      spinState.lastX = event.clientX;
      const deltaRotation = deltaX * DRAG_RADIANS_PER_PIXEL;
      spinState.offset += deltaRotation;
      spinState.velocity = deltaRotation * 60;
    };
    const handleUp = () => {
      spinState.isDragging = false;
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, []);

  const onPointerDownCapture = (event: ReactPointerEvent) => {
    beginSpinDrag(event.clientX);
  };

  return { onPointerDownCapture };
}
