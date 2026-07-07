/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared drag-to-spin state. Dragging scrubs TIME for the whole system:
 * the earth converts the offset to extra rotation, the moon converts the
 * same offset to extra orbital travel at its own (slower) rate — so a
 * fling moves both bodies in honest proportion.
 *
 * Mutable singleton by design: it is read/written inside the render loop
 * every frame, where allocation-free mutation is the idiomatic pattern.
 */

export type SpinState = {
  /** Extra earth-rotation (radians) accumulated by user drags. */
  offset: number;
  /** Leftover fling momentum, decays after release. */
  velocity: number;
  isDragging: boolean;
  lastX: number;
};

export const spinState: SpinState = {
  offset: 0,
  velocity: 0,
  isDragging: false,
  lastX: 0,
};

/** Start a drag from any grabbable body (earth, moon, ...). */
export function beginSpinDrag(clientX: number): void {
  spinState.isDragging = true;
  spinState.lastX = clientX;
}
