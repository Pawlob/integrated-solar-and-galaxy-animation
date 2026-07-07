/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The visible Sun: a layered additive glow billboard parked far along
 * SUN_DIRECTION, always facing the camera. Because it sits exactly where
 * every shader's light comes from, the story can never contradict the
 * physics — the earth occludes it until the camera rounds the planet,
 * and when it appears, everything facing it is correctly in shadow.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, type Mesh } from 'three';
import { sunVertexShader, sunFragmentShader } from './sun-shaders';
import {
  SUN_DIRECTION,
  SUN_DISTANCE,
  SUN_GLOW_RADIUS,
} from '../../lib/scene-constants';

export function Sun() {
  const billboardRef = useRef<Mesh>(null);

  const position = useMemo(
    () => SUN_DIRECTION.clone().multiplyScalar(SUN_DISTANCE),
    [],
  );

  useFrame(({ camera }) => {
    if (billboardRef.current) {
      billboardRef.current.lookAt(camera.position);
    }
  });

  return (
    <mesh ref={billboardRef} position={position}>
      <planeGeometry args={[SUN_GLOW_RADIUS * 2, SUN_GLOW_RADIUS * 2]} />
      <shaderMaterial
        vertexShader={sunVertexShader}
        fragmentShader={sunFragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}
