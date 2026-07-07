/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Day/night shader with ocean sun-glint and limb haze. Each fragment
 * compares its world-space normal against the fixed sun direction: facing
 * the sun shows the Blue Marble day map, facing away shows the Black Marble
 * city lights. Water (from the specular mask) throws a golden Blinn-Phong
 * glint back at the camera; grazing view angles pick up a faint blue
 * atmospheric haze. The shade stays static in space while the earth mesh
 * rotates through it — matching reality.
 */

export const earthVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const earthFragmentShader = /* glsl */ `
  uniform sampler2D uDayMap;
  uniform sampler2D uNightMap;
  uniform sampler2D uSpecularMap;
  uniform sampler2D uCloudMap;
  uniform float uCloudShift;
  uniform vec3 uSunDirection;
  uniform float uOceanShininess;
  uniform float uOceanGlintStrength;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    // How directly this point faces the sun: +1 noon, 0 terminator, -1 midnight.
    float sunDot = dot(normal, uSunDirection);
    float dayStrength = clamp(sunDot, 0.0, 1.0);

    // Day side: lambert-style falloff so the surface rounds off toward dusk.
    // Floor raised from 0.15 — phone screens at normal brightness crushed
    // the darker version toward black.
    vec3 dayColor = texture2D(uDayMap, vUv).rgb;
    dayColor *= 0.28 + 0.72 * pow(dayStrength, 0.6);

    // Grazing sunlight is redder: where the sun sits low on the local
    // horizon, tint the LIGHT itself gently warm. The night side gets nothing.
    float lowSun = 1.0 - smoothstep(0.05, 0.45, dayStrength);
    dayColor *= mix(vec3(1.0), vec3(1.05, 0.72, 0.5), lowSun * 0.6);

    // Ocean sun-glint: water is mirror-like where sun, surface and camera
    // align (Blinn-Phong). Land stays matte via the specular mask.
    float oceanMask = texture2D(uSpecularMap, vUv).r;
    vec3 halfway = normalize(uSunDirection + viewDir);
    float specular = pow(max(dot(normal, halfway), 0.0), uOceanShininess);
    dayColor += vec3(1.0, 0.76, 0.42) * specular * oceanMask * dayStrength * uOceanGlintStrength;

    // Cloud shadows: darken the ground beneath the drifting cloud shell.
    // uCloudShift tracks the shell's extra rotation so shadows stay glued
    // under their clouds; the mip bias softens edges into a penumbra.
    float cloudShadow = texture2D(uCloudMap, vec2(vUv.x - uCloudShift, vUv.y), 1.5).r;
    dayColor *= 1.0 - cloudShadow * 0.4 * dayStrength;

    // Night side: golden city lights, gently boosted.
    vec3 nightColor = texture2D(uNightMap, vUv).rgb * 1.7;

    // Blend across the terminator with a soft edge.
    float dayFactor = smoothstep(-0.08, 0.18, sunDot);
    vec3 color = mix(nightColor, dayColor, dayFactor);

    // Faint blue haze where the view grazes the limb — the air itself.
    float fresnel = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), 3.0);
    color += vec3(0.15, 0.35, 0.72) * fresnel * (0.15 + 0.85 * dayFactor) * 0.55;

    gl_FragColor = vec4(color, 1.0);
  }
`;
