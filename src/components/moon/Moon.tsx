/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The Moon: real 27% size ratio, tidally locked (the familiar near side
 * always faces Earth), orbiting west-to-east on an 18-degree inclined
 * path. Lit by the same fixed sun as Earth, so its phases cycle
 * automatically as it travels: full on the far side, crescent near the
 * sun, occulted briefly behind the planet.
 */

import { useMemo, useRef } from 'react';
import {
  useFrame,
  useLoader,
  useThree,
} from '@react-three/fiber';
import { TextureLoader, type Group, type Mesh } from 'three';
import { pickTextureQuality } from '../../lib/texture-quality';
import { textureUrl } from '../../lib/asset-url';
import { moonVertexShader, moonFragmentShader } from './moon-shaders';
import {
  EARTH_ROTATION_SPEED,
  getMoonOrbitRadius,
  MOON_BRIGHTNESS,
  MOON_INITIAL_ANGLE,
  MOON_ORBIT_ECCENTRICITY,
  MOON_ORBIT_INCLINATION_RAD,
  MOON_ORBIT_SPEED,
  MOON_RADIUS,
  MOON_SEGMENTS,
  MOON_TIDAL_LOCK_OFFSET,
  SUN_DIRECTION,
} from '../../lib/scene-constants';
import { spinState } from '../../lib/spin-state';

/**
 * The drag offset is measured in earth-rotation radians; the moon travels
 * its orbit at this fraction of the earth's spin rate, so a fling advances
 * both bodies in honest proportion (one earth-day = one third of an orbit
 * at the cinematic 2min/6min timescale).
 */
const ORBIT_PER_SPIN = MOON_ORBIT_SPEED / EARTH_ROTATION_SPEED;

export function Moon() {
  const orbitRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);

  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const quality = useMemo(() => pickTextureQuality(gl), [gl]);
  const moonMap = useLoader(TextureLoader, textureUrl(`moon_${quality}.jpg`));
  // Anisotropic filtering has a real per-fragment cost on mobile GPUs —
  // scale it down alongside the same signal that already picks texture
  // resolution, instead of a flat value everywhere.
  const anisotropy = quality === '8k' ? 8 : 4;

  const uniforms = useMemo(() => {
    moonMap.anisotropy = anisotropy;
    return {
      uMoonMap: { value: moonMap },
      uSunDirection: { value: SUN_DIRECTION.clone() },
      uBrightness: { value: MOON_BRIGHTNESS },
    };
  }, [moonMap, anisotropy]);

  // Same aspect-aware compression CameraRig frames around — kept in sync
  // by reading the identical function, so the orbit never outgrows what
  // the camera guarantees is visible. This is the SEMI-MAJOR axis. Only
  // depends on viewport shape (resize), never on time — memoized so it's
  // not recomputed 60-120 times a second.
  const semiMajor = useMemo(
    () => getMoonOrbitRadius(size.width / size.height),
    [size.width, size.height],
  );

  useFrame(({ clock }) => {
    // Kepler's laws, compressed but true in shape and rhythm:
    //  - mean anomaly advances uniformly with time,
    const meanAnomaly =
      MOON_INITIAL_ANGLE +
      clock.elapsedTime * MOON_ORBIT_SPEED +
      spinState.offset * ORBIT_PER_SPIN;
    //  - the equation of center (first order) makes the moon sweep
    //    faster near perigee — Kepler's second law,
    const trueAnomaly =
      meanAnomaly + 2 * MOON_ORBIT_ECCENTRICITY * Math.sin(meanAnomaly);
    //  - and the ellipse-from-focus radius puts EARTH AT ONE FOCUS —
    //    Kepler's first law: perigee on one side, apogee on the other.
    const e = MOON_ORBIT_ECCENTRICITY;
    const orbitRadius =
      (semiMajor * (1 - e * e)) / (1 + e * Math.cos(trueAnomaly));

    const x = orbitRadius * Math.sin(trueAnomaly);
    const flatZ = orbitRadius * Math.cos(trueAnomaly);
    // Tilt the orbit plane about the X axis by the inclination.
    const y = -Math.sin(MOON_ORBIT_INCLINATION_RAD) * flatZ;
    const z = Math.cos(MOON_ORBIT_INCLINATION_RAD) * flatZ;

    if (orbitRef.current) {
      orbitRef.current.position.set(x, y, z);
    }
    if (meshRef.current) {
      // Tidal lock: the moon SPINS uniformly (mean anomaly) while its
      // orbit speed varies — the mismatch makes the face wobble a few
      // degrees per orbit. That wobble is real: lunar libration.
      meshRef.current.rotation.y = meanAnomaly + MOON_TIDAL_LOCK_OFFSET;
    }
  });

  return (
    <group ref={orbitRef}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[MOON_RADIUS, MOON_SEGMENTS, MOON_SEGMENTS]} />
        <shaderMaterial
          vertexShader={moonVertexShader}
          fragmentShader={moonFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
    </group>
  );
}
