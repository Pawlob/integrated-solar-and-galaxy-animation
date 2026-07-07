/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Atmosphere halo. A slightly larger back-facing shell rendered additively:
 * strongest right at the planet's silhouette and fading outward, brighter
 * on the sun side and dimmer around the night limb — the thin blue line
 * astronauts talk about.
 */

export const atmosphereVertexShader = /* glsl */ `
  varying vec3 vViewNormal;
  varying vec3 vWorldNormal;

  void main() {
    vViewNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uSunDirection;

  varying vec3 vViewNormal;
  varying vec3 vWorldNormal;

  void main() {
    // Back-facing shell: fragments near the silhouette have view-space
    // normals nearly perpendicular to the view axis. The pow shapes how
    // quickly the halo fades outward from the edge.
    float rim = pow(0.72 + dot(normalize(vViewNormal), vec3(0.0, 0.0, -1.0)), 5.0);

    // The halo belongs to the sun: bright on the day limb, faint at night.
    float sunSide = 0.2 + 0.8 * smoothstep(-0.4, 0.6, dot(normalize(vWorldNormal), uSunDirection));

    vec3 atmosphereColor = vec3(0.35, 0.6, 1.0);
    gl_FragColor = vec4(atmosphereColor * rim * sunSide, rim * sunSide);
  }
`;
