/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Two static point layers above the flat deep-space photo:
 *  - STARS: a far shell of twinkling pinpricks (no drift, only blink).
 *  - DUST:  a near shell of tiny dim motes. Being close to the camera,
 *    they parallax strongly while the scroll journey moves the viewpoint —
 *    the "particles streaming past" depth effect.
 */

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, type ShaderMaterial } from 'three';
import { starVertexShader, starFragmentShader } from './star-shaders';
import {
  DUST_COUNT,
  DUST_FIELD_RADIUS,
  DUST_SEED,
  STAR_COUNT,
  STAR_FIELD_RADIUS,
  STAR_SEED,
} from '../../lib/scene-constants';

/** Small deterministic PRNG (mulberry32) — a stable sky across visits. */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Real stellar tints: mostly white, some warm, some ice-blue. */
const STAR_PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [1.0, 1.0, 1.0],
  [1.0, 1.0, 1.0],
  [1.0, 0.88, 0.72],
  [0.75, 0.85, 1.0],
];

type FieldAttributes = {
  positions: Float32Array;
  sizes: Float32Array;
  phases: Float32Array;
  speeds: Float32Array;
  colors: Float32Array;
};

type FieldConfig = {
  seed: number;
  count: number;
  radius: number;
  sizeMin: number;
  sizeMax: number;
  /** Multiplies the palette color — dust is dimmer than stars. */
  brightness: number;
};

function generateField(config: FieldConfig): FieldAttributes {
  const random = createSeededRandom(config.seed);
  const positions = new Float32Array(config.count * 3);
  const sizes = new Float32Array(config.count);
  const phases = new Float32Array(config.count);
  const speeds = new Float32Array(config.count);
  const colors = new Float32Array(config.count * 3);

  for (let i = 0; i < config.count; i++) {
    const z = 2 * random() - 1;
    const azimuth = 2 * Math.PI * random();
    const ring = Math.sqrt(1 - z * z);
    const radius = config.radius * (0.94 + 0.12 * random());
    positions[i * 3] = radius * ring * Math.cos(azimuth);
    positions[i * 3 + 1] = radius * z;
    positions[i * 3 + 2] = radius * ring * Math.sin(azimuth);

    sizes[i] =
      config.sizeMin + (config.sizeMax - config.sizeMin) * random() * random();
    phases[i] = 2 * Math.PI * random();
    speeds[i] = 0.4 + 1.6 * random();

    const tint = STAR_PALETTE[Math.floor(random() * STAR_PALETTE.length)];
    colors[i * 3] = tint[0] * config.brightness;
    colors[i * 3 + 1] = tint[1] * config.brightness;
    colors[i * 3 + 2] = tint[2] * config.brightness;
  }

  return { positions, sizes, phases, speeds, colors };
}

type FieldUniforms = {
  uTime: { value: number };
  uPixelRatio: { value: number };
};

type FieldProps = {
  field: FieldAttributes;
  timeUniform: FieldUniforms;
  materialRef: React.RefObject<ShaderMaterial | null>;
};

function PointField({ field, timeUniform, materialRef }: FieldProps) {
  return (
    <points renderOrder={-1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[field.positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[field.sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[field.phases, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[field.speeds, 1]} />
        <bufferAttribute attach="attributes-aColor" args={[field.colors, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={timeUniform}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

export function Stars() {
  const starMaterialRef = useRef<ShaderMaterial>(null);
  const dustMaterialRef = useRef<ShaderMaterial>(null);

  const starField = useMemo(
    () =>
      generateField({
        seed: STAR_SEED,
        count: STAR_COUNT,
        radius: STAR_FIELD_RADIUS,
        sizeMin: 0.22,
        sizeMax: 0.72,
        brightness: 1.0,
      }),
    [],
  );

  const dustField = useMemo(
    () =>
      generateField({
        seed: DUST_SEED,
        count: DUST_COUNT,
        radius: DUST_FIELD_RADIUS,
        sizeMin: 0.05,
        sizeMax: 0.2,
        brightness: 0.6,
      }),
    [],
  );

  const starUniforms = useMemo<FieldUniforms>(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 } }),
    [],
  );
  const dustUniforms = useMemo<FieldUniforms>(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 } }),
    [],
  );

  // R3F's viewport.dpr is the ACTUAL clamped device pixel ratio in use
  // (respects the Canvas dpr={[1,2]} cap). Without this, points sized
  // for a dpr-1 desktop shrink to sub-pixel and vanish on dense phones.
  const pixelRatio = useThree((state) => state.viewport.dpr);
  // Defensive fallback: never feed the shader a NaN/zero ratio.
  const safePixelRatio =
    Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1;

  useFrame(({ clock }) => {
    if (starMaterialRef.current) {
      starMaterialRef.current.uniforms.uTime.value = clock.elapsedTime;
      starMaterialRef.current.uniforms.uPixelRatio.value = safePixelRatio;
    }
    if (dustMaterialRef.current) {
      dustMaterialRef.current.uniforms.uTime.value = clock.elapsedTime;
      dustMaterialRef.current.uniforms.uPixelRatio.value = safePixelRatio;
    }
  });

  return (
    <>
      <PointField
        field={starField}
        timeUniform={starUniforms}
        materialRef={starMaterialRef}
      />
      <PointField
        field={dustField}
        timeUniform={dustUniforms}
        materialRef={dustMaterialRef}
      />
    </>
  );
}
