/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cloud shell shader. The cloud map's brightness becomes opacity, so clear
 * sky is fully transparent. Clouds are lit by the same fixed sun as the
 * ground: white in daylight, warm at the terminator, near-invisible at
 * night. Near the planet's limb the shell fades out so it dissolves into
 * the atmosphere glow instead of standing off the silhouette as a crust.
 */

export const cloudVertexShader = /* glsl */ `
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

export const cloudFragmentShader = /* glsl */ `
  uniform sampler2D uCloudMap;
  uniform vec3 uSunDirection;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float sunDot = dot(normal, uSunDirection);
    float dayStrength = clamp(sunDot, 0.0, 1.0);

    float cloudDensity = texture2D(uCloudMap, vUv).r;

    // Same sun as the ground: bright by day, a whisper of moonlight by night.
    float light = 0.03 + 0.97 * pow(dayStrength, 0.7);
    vec3 cloudColor = vec3(light);

    // Sunset-colored clouds where the sun grazes the horizon.
    float lowSun = 1.0 - smoothstep(0.05, 0.45, dayStrength);
    cloudColor *= mix(vec3(1.0), vec3(1.06, 0.75, 0.55), lowSun * 0.55);

    // Limb fade: where the view grazes the shell, dissolve the clouds into
    // the atmosphere instead of letting them rim the silhouette.
    float facing = clamp(dot(normal, viewDir), 0.0, 1.0);
    float limbFade = smoothstep(0.02, 0.3, facing);

    gl_FragColor = vec4(cloudColor, cloudDensity * uOpacity * limbFade);
  }
`;
