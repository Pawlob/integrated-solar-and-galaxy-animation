/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Single source of truth for the scene's physical layout.
 * Camera fixed between sun and earth (the "red arrow"), sun fixed in space,
 * the earth itself rotates west to east.
 */

import { Vector3 } from 'three';

export const EARTH_RADIUS = 2.3;
export const EARTH_SEGMENTS = 128;

/**
 * Real axial tilt is 23.4 degrees; straightened to 0 for a cleaner
 * presentation (per user preference — the NASA-poster look).
 */
export const EARTH_AXIAL_TILT_RAD = 0;

/** One full rotation every ~46 seconds — 30% faster than 1 day/minute. */
export const EARTH_ROTATION_SPEED = (2 * Math.PI) / (60 / 1.3);

/** Start with Africa facing the camera. */
export const EARTH_INITIAL_ROTATION_Y = 1.92;

/**
 * Fixed sun, in world space, ~72.5 degrees off the camera axis to the RIGHT
 * (matching the user's reference imagery). Splits the visible disk ~65% day
 * / ~35% night with the night crescent on the LEFT. With west-to-east
 * rotation this shows the MORNING terminator: cities arrive glittering out
 * of the night and dawn washes them into daylight. Visible sunrise; sunset
 * happens hidden behind the planet.
 * (Flip the X sign to move the sun left — that swaps sunrise for sunset,
 * night crescent to the right.)
 */
export const SUN_DIRECTION = new Vector3(3.1, 0.0, 1.0).normalize();

/**
 * The journey starts ZOOMED OUT: the whole galaxy in view, Earth a bright
 * speck at the tip of one arm. Scrolling/pinching zooms in (OrbitControls,
 * target = Earth at the origin) until the planet fills the frame. Same
 * gentle northern elevation as the original close-up framing.
 */
export const CAMERA_POSITION: [number, number, number] = [0, 0.7, 7.97];
export const CAMERA_FOV = 45;
/**
 * Breathing room so the moon never clips as it circles. sin()-based framing
 * in CameraRig uses this as a bounding sphere — safe at every aspect ratio.
 */
export const SCENE_FRAME_MARGIN = 1.12;

/**
 * A perspective camera can only satisfy ONE required world-space width for
 * a GIVEN aspect ratio before the ceiling on apparent object size is fixed
 * by geometry — no FOV/distance trick beats it (proof: the achievable
 * on-screen fraction converges to `aspect * (radius / frameRadius)`
 * regardless of FOV). Narrow phones therefore see the earth much smaller
 * than wide screens IF the moon's orbit width is held constant. So the
 * orbit's cinematic compression (already a documented cheat — reality is
 * ~30 earth-diameters) is made itself aspect-aware: portrait phones pull
 * the moon in closer, shrinking the required frame width and letting the
 * camera sit much closer, while landscape/square screens keep the exact
 * distance already tuned (zero regression there).
 */
export const MOON_ORBIT_RADIUS_LANDSCAPE = 6.2;
/** Tightest cinematic compression, used at PORTRAIT_MIN_ASPECT and below. */
export const MOON_ORBIT_RADIUS_PORTRAIT_MIN = 4.0;
/** Roughly the narrowest common phone screen (e.g. 9:20 ≈ 0.45). */
export const PORTRAIT_MIN_ASPECT = 0.45;

/**
 * Moon's live orbit radius for the current viewport aspect (width/height).
 * aspect >= 1 (square/landscape): unchanged reference distance.
 * aspect <= PORTRAIT_MIN_ASPECT: fully compressed (closest to earth).
 * Between the two: smooth linear interpolation — no visible "snap" as a
 * device rotates or a window is resized.
 */
export function getMoonOrbitRadius(aspect: number): number {
  if (aspect >= 1) return MOON_ORBIT_RADIUS_LANDSCAPE;
  const clampedAspect = Math.max(aspect, PORTRAIT_MIN_ASPECT);
  const t = (clampedAspect - PORTRAIT_MIN_ASPECT) / (1 - PORTRAIT_MIN_ASPECT);
  return (
    MOON_ORBIT_RADIUS_PORTRAIT_MIN +
    t * (MOON_ORBIT_RADIUS_LANDSCAPE - MOON_ORBIT_RADIUS_PORTRAIT_MIN)
  );
}

/**
 * Bounding sphere the camera must keep inside the tightest screen dimension
 * for the CURRENT aspect ratio. Framing the full moon orbit (not just
 * Earth) means the moon never leaves the frame as it circles.
 */
export function getSceneFrameRadius(aspect: number): number {
  return (getMoonOrbitRadius(aspect) + MOON_RADIUS) * SCENE_FRAME_MARGIN;
}

/** Drag-to-spin feel: radians of extra spin per pixel of horizontal drag. */
export const DRAG_RADIANS_PER_PIXEL = 0.005;

/** How quickly the thrown-globe momentum fades (higher = stops sooner). */
export const SPIN_INERTIA_DECAY = 2.5;

/** Cloud shell floats 1.2% above the surface and drifts 12% faster. */
export const CLOUD_ALTITUDE_SCALE = 1.012;
export const CLOUD_DRIFT_FACTOR = 1.12;
export const CLOUD_OPACITY = 0.9;

/** Atmosphere halo shell, slightly larger than the cloud layer. */
export const ATMOSPHERE_SCALE = 1.045;

/**
 * Ocean sun-glint: higher shininess = tighter, more mirror-like highlight.
 * Strength kept below full so the golden tint survives instead of clipping
 * to white at the hot core.
 */
export const OCEAN_SHININESS = 48.0;
export const OCEAN_GLINT_STRENGTH = 0.78;

/**
 * The Moon. Size ratio is the real 27% of Earth — never cheated. The
 * orbit distance is cinematically compressed (reality is ~30 Earth
 * diameters; that reveal is saved for the scroll journey). Inclination of
 * 18 degrees is honest physics: the Moon's orbit sits 18-28 degrees off
 * Earth's equator, and it also keeps the near pass below the camera frame.
 */
export const MOON_RADIUS = EARTH_RADIUS * 0.27;
export const MOON_SEGMENTS = 96;
/**
 * Cinematic 3:1 ratio kept: one orbit = 3 earth-days. 30% faster than
 * before, same multiplier as EARTH_ROTATION_SPEED so the ratio holds.
 */
export const MOON_ORBIT_SPEED = (2 * Math.PI) / (180 / 1.3);
/**
 * The real orbit is an ELLIPSE, not a circle: perigee 357,379 km vs
 * apogee 406,120 km — eccentricity ≈ 0.055, with Earth at one FOCUS
 * (Kepler's first law). Our compressed orbit keeps that exact shape
 * ratio, and the Moon genuinely travels faster near perigee (Kepler's
 * second law, via the first-order equation of center).
 */
export const MOON_ORBIT_ECCENTRICITY = 0.055;
/**
 * 5 degrees — the moon's true tilt against the ecliptic. (Its tilt vs
 * Earth's EQUATOR is 18-28°, but that made it dive visibly under the
 * planet; the 5° figure keeps it level with Earth, the classic look.)
 */
export const MOON_ORBIT_INCLINATION_RAD = (5 * Math.PI) / 180;
/** Start back-right of Earth: visible at load, half-lit by the right sun. */
export const MOON_INITIAL_ANGLE = (3 * Math.PI) / 4;
/** Keeps the familiar near-side face pointed at Earth (tidal lock). */
export const MOON_TIDAL_LOCK_OFFSET = Math.PI / 2;

/**
 * Apollo-photo exposure: the real moon is asphalt-dark, but NASA's own
 * photos push exposure until it reads silvery white. 1.0 = physical.
 */
export const MOON_BRIGHTNESS = 1.7;

/**
 * The sky is mostly the deep-space photo, flat behind the transparent
 * canvas at native resolution (no wrapping = no blur). A static twinkling
 * star layer renders inside the canvas on top of it (no drift — the
 * photo already carries the field, this just adds blink).
 */
export const STAR_COUNT = 650;
export const STAR_FIELD_RADIUS = 30;
/** Deterministic placement — the same sky every visit. */
export const STAR_SEED = 20260707;

/**
 * Stardust: a second, much closer shell of tiny dim motes. Being near the
 * camera, they parallax hard during the scroll journey — the "particles
 * streaming past" feeling — while staying too small to read as stars.
 */
export const DUST_COUNT = 900;
export const DUST_FIELD_RADIUS = 14;
export const DUST_SEED = 20260708;

/**
 * The scroll journey. Page scroll (0..1) is smoothed with inertia, then
 * drives two things at once: the universe's clock (earth spins ahead,
 * moon advances — the same time-scrub as dragging) and a slow camera
 * swing from the dawn side toward full daylight, dipping slightly closer
 * mid-journey. Double motion = the parallax that makes scrolling feel
 * cinematic.
 */
export const SCROLL_SMOOTHING = 3.0;
/**
 * The endless tour: the camera orbits a fixed slice PER PAGE scrolled,
 * forever — 7 pages or 100, it just keeps circling (the geometry wraps
 * seamlessly). 0.757 rad/page ≈ 43°/page: the 7-page demo arrives at the
 * backlit sun finale on its last page (6 scroll-pages × 0.757 ≈ 260°,
 * sun just off the dark earth's limb), and longer books meet the sun
 * again roughly every 8.3 pages — periodic, like real orbits.
 */
export const SCROLL_AZIMUTH_PER_PAGE = 0.757;

/**
 * The visible Sun. Parked far along SUN_DIRECTION — the exact direction
 * every shader's light comes from — so the visual and the physics can
 * never disagree. Beyond max framing distance; earth occludes it
 * naturally until the camera rounds the planet.
 */
export const SUN_DISTANCE = 400;
export const SUN_GLOW_RADIUS = 45;
/**
 * Periodic breathing (works at ANY page count): once per full camera
 * circle the viewpoint dips up to 15% closer and rises a few degrees,
 * then settles back — seamless forever, no start or end.
 */
export const SCROLL_BREATHE_DIP = 0.15;
export const SCROLL_ELEVATION_WAVE_RAD = 0.05;

