/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Moon shader. Pure airless lambert lighting from the same fixed sun that
 * lights Earth — so the phases emerge from geometry, never painted. No
 * atmosphere means: razor-sharp limb, no halo, and a neutral (not warm)
 * terminator — there are no red sunsets on the Moon. The dark side carries
 * a whisper of blue-tinted earthshine, the glow of Earth reflected back.
 */

export const moonVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const moonFragmentShader = /* glsl */ `
  uniform sampler2D uMoonMap;
  uniform vec3 uSunDirection;
  uniform float uBrightness;

  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    float sunDot = dot(normal, uSunDirection);
    float dayStrength = clamp(sunDot, 0.0, 1.0);

    vec3 surface = texture2D(uMoonMap, vUv).rgb;

    // Apollo-photo exposure: push the surface toward silvery white, with
    // only a light highlight compression — strong contrast is what makes
    // rock read as rock instead of frosted glass.
    vec3 lit = surface * uBrightness;
    lit = lit / (1.0 + 0.22 * lit);

    // Near-true lambert falloff: airless worlds shade hard and neutral.
    vec3 sunlight = lit * pow(dayStrength, 0.95);

    // Earthshine: the night side faintly lit by Earth's blue reflection.
    vec3 earthshine = surface * vec3(0.030, 0.036, 0.050);

    gl_FragColor = vec4(sunlight + earthshine, 1.0);
  }
`;
