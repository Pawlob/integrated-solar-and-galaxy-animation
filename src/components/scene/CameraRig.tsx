/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Camera rig, two jobs in one frame loop:
 *
 * 1. RESPONSIVE FRAMING — keeps the moon's entire orbit inside the frame
 *    at any aspect ratio (portrait phones constrain horizontally, wide
 *    screens vertically; the camera backs off exactly as far as the
 *    tighter side requires).
 *
 * 2. THE SCROLL JOURNEY — smoothed page-scroll progress swings the camera
 *    around the scene like a scrubber: scroll down travels forward,
 *    scroll up retraces the EXACT same path backward. Earth's spin and
 *    the moon's orbit run on their own independent clocks and never
 *    reverse — but reversing the camera's fast swing against their slow
 *    true rotation makes continents visually appear to rewind while
 *    scrolling up, the way a video does. That's intentional: scrolling
 *    back should look like going back.
 */

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CAMERA_FOV,
  CAMERA_POSITION,
  getSceneFrameRadius,
  SCROLL_AZIMUTH_PER_PAGE,
  SCROLL_BREATHE_DIP,
  SCROLL_ELEVATION_WAVE_RAD,
  SCROLL_SMOOTHING,
} from '../../lib/scene-constants';
import { scrollState } from '../../lib/scroll-state';

const BASE_AZIMUTH = Math.atan2(CAMERA_POSITION[0], CAMERA_POSITION[2]);
const BASE_ELEVATION = Math.atan2(
  CAMERA_POSITION[1],
  Math.hypot(CAMERA_POSITION[0], CAMERA_POSITION[2]),
);

export function CameraRig() {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const smoothedRef = useRef(scrollState.pages);

  // This trig only depends on the viewport SHAPE (resize), never on
  // time — recomputing it 60-120 times a second was pure waste on
  // mobile CPUs. Memoized on aspect ratio alone.
  const baseDistance = useMemo(() => {
    const aspect = size.width / size.height;
    const verticalHalf = (CAMERA_FOV * Math.PI) / 360;
    const horizontalHalf = Math.atan(Math.tan(verticalHalf) * aspect);
    const tightestHalf = Math.min(verticalHalf, horizontalHalf);
    return getSceneFrameRadius(aspect) / Math.sin(tightestHalf);
  }, [size.width, size.height]);

  useFrame((_, delta) => {
    // Ease toward the real scroll position — the scene glides, never jumps.
    const previous = smoothedRef.current;
    const eased =
      previous +
      (scrollState.pages - previous) * Math.min(1, delta * SCROLL_SMOOTHING);
    smoothedRef.current = eased;

    // Signed: scrolling down travels forward, scrolling up retraces the
    // exact same path backward. The BODIES are never touched — earth
    // spins and the moon orbits purely on their own clocks; only the
    // CAMERA's position is a direct function of scroll position.
    const travel = eased * SCROLL_AZIMUTH_PER_PAGE;
    const breathe = 0.5 - 0.5 * Math.cos(travel);
    const distance = baseDistance * (1 - SCROLL_BREATHE_DIP * breathe);
    // MINUS: the camera orbits AGAINST the earth's spin, so scrolling
    // makes the world appear to rotate in its natural direction (west to
    // east), only faster — never backwards.
    const azimuth = BASE_AZIMUTH - travel;
    const elevation =
      BASE_ELEVATION + Math.sin(travel) * SCROLL_ELEVATION_WAVE_RAD;

    camera.position.set(
      distance * Math.cos(elevation) * Math.sin(azimuth),
      distance * Math.sin(elevation),
      distance * Math.cos(elevation) * Math.cos(azimuth),
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
}
