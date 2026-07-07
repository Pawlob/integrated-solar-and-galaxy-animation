/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The planet, in three nested layers sharing one fixed sun:
 *   1. the surface (day/night shader + ocean glint),
 *   2. the cloud shell (drifts slightly faster than the ground),
 *   3. the atmosphere halo (additive back-facing rim glow).
 */

import { useMemo, useRef } from 'react';
import {
  useFrame,
  useLoader,
  useThree,
} from '@react-three/fiber';
import { AdditiveBlending, BackSide, TextureLoader, type Mesh } from 'three';
import { pickTextureQuality } from '../../lib/texture-quality';
import { textureUrl } from '../../lib/asset-url';
import { earthVertexShader, earthFragmentShader } from './earth-shaders';
import { cloudVertexShader, cloudFragmentShader } from './cloud-shaders';
import {
  atmosphereVertexShader,
  atmosphereFragmentShader,
} from './atmosphere-shaders';
import {
  ATMOSPHERE_SCALE,
  CLOUD_ALTITUDE_SCALE,
  CLOUD_DRIFT_FACTOR,
  CLOUD_OPACITY,
  EARTH_AXIAL_TILT_RAD,
  EARTH_INITIAL_ROTATION_Y,
  EARTH_RADIUS,
  EARTH_ROTATION_SPEED,
  EARTH_SEGMENTS,
  OCEAN_GLINT_STRENGTH,
  OCEAN_SHININESS,
  SPIN_INERTIA_DECAY,
  SUN_DIRECTION,
} from '../../lib/scene-constants';
import { spinState } from '../../lib/spin-state';

export function Earth() {
  const surfaceRef = useRef<Mesh>(null);
  const cloudsRef = useRef<Mesh>(null);

  // Phones and iOS GPUs get the 2K set; big screens get the 8K set.
  const gl = useThree((state) => state.gl);
  const quality = useMemo(() => pickTextureQuality(gl), [gl]);
  // Anisotropic filtering has a real per-fragment cost on mobile GPUs —
  // scale it down alongside the same signal that already picks texture
  // resolution, instead of a flat value everywhere.
  const anisotropy = quality === '8k' ? 8 : 4;

  const [dayMap, nightMap, cloudMap, specularMap] = useLoader(TextureLoader, [
    textureUrl(`earth_day_${quality}.jpg`),
    textureUrl(`earth_night_${quality}.jpg`),
    textureUrl(`earth_clouds_${quality}.jpg`),
    textureUrl('earth_specular_2k.jpg'),
  ]);

  const surfaceUniforms = useMemo(() => {
    dayMap.anisotropy = anisotropy;
    nightMap.anisotropy = anisotropy;
    specularMap.anisotropy = anisotropy;
    return {
      uDayMap: { value: dayMap },
      uNightMap: { value: nightMap },
      uSpecularMap: { value: specularMap },
      uCloudMap: { value: cloudMap },
      uCloudShift: { value: 0 },
      uSunDirection: { value: SUN_DIRECTION.clone() },
      uOceanShininess: { value: OCEAN_SHININESS },
      uOceanGlintStrength: { value: OCEAN_GLINT_STRENGTH },
    };
  }, [dayMap, nightMap, specularMap, cloudMap, anisotropy]);

  const cloudUniforms = useMemo(() => {
    cloudMap.anisotropy = anisotropy;
    return {
      uCloudMap: { value: cloudMap },
      uSunDirection: { value: SUN_DIRECTION.clone() },
      uOpacity: { value: CLOUD_OPACITY },
    };
  }, [cloudMap, anisotropy]);

  const atmosphereUniforms = useMemo(
    () => ({
      uSunDirection: { value: SUN_DIRECTION.clone() },
    }),
    [],
  );

  useFrame(({ clock }, delta) => {
    if (!spinState.isDragging) {
      // Glide on leftover momentum, then fade back to the natural rotation.
      spinState.offset += spinState.velocity * delta;
      spinState.velocity *= Math.exp(-SPIN_INERTIA_DECAY * delta);
    }
    const baseRotation =
      EARTH_INITIAL_ROTATION_Y +
      clock.elapsedTime * EARTH_ROTATION_SPEED +
      spinState.offset;
    if (surfaceRef.current) {
      surfaceRef.current.rotation.y = baseRotation;
    }
    const cloudDrift =
      clock.elapsedTime * EARTH_ROTATION_SPEED * (CLOUD_DRIFT_FACTOR - 1);
    if (cloudsRef.current) {
      // Clouds share the drag spin but drift a little ahead of the ground.
      cloudsRef.current.rotation.y = baseRotation + cloudDrift;
    }
    // Keep ground shadows glued beneath their drifting clouds: convert the
    // shell's extra rotation into a texture-space U offset.
    surfaceUniforms.uCloudShift.value = cloudDrift / (2 * Math.PI);
  });

  return (
    <group rotation={[0, 0, EARTH_AXIAL_TILT_RAD]}>
      <mesh ref={surfaceRef}>
        <sphereGeometry args={[EARTH_RADIUS, EARTH_SEGMENTS, EARTH_SEGMENTS]} />
        <shaderMaterial
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
          uniforms={surfaceUniforms}
        />
      </mesh>

      <mesh ref={cloudsRef} scale={CLOUD_ALTITUDE_SCALE}>
        <sphereGeometry args={[EARTH_RADIUS, EARTH_SEGMENTS, EARTH_SEGMENTS]} />
        <shaderMaterial
          vertexShader={cloudVertexShader}
          fragmentShader={cloudFragmentShader}
          uniforms={cloudUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>

      <mesh scale={ATMOSPHERE_SCALE} renderOrder={2}>
        <sphereGeometry args={[EARTH_RADIUS, EARTH_SEGMENTS, EARTH_SEGMENTS]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={atmosphereUniforms}
          transparent
          depthWrite={false}
          side={BackSide}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
