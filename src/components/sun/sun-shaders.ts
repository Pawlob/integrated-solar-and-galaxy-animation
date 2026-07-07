/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The Sun as a layered additive billboard: blinding white core, warm
 * golden inner glow, wide orange-amber corona, plus soft four-point
 * diffraction spikes (the "camera glare" of every real space photo).
 * Emissive by nature — it makes light, it never receives any.
 */

export const sunVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const sunFragmentShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vec2 centered = vUv - 0.5;
    float d = length(centered) * 2.0;

    // A perfectly ROUND sun, like NASA's own renders: a creamy-white
    // center melting through a gaussian body into a wide warm halo.
    // No spikes, no shapes — just soft radial light.
    // Space has no air to scatter light: a compact fierce disc with only
    // a tight glare, not a wide halo.
    float core = 1.0 - smoothstep(0.0, 0.22, d);
    float glow = exp(-d * d * 9.0) * 0.7;
    float halo = pow(max(1.0 - d, 0.0), 3.5) * 0.18;

    vec3 color = vec3(1.0, 0.98, 0.92) * core
      + vec3(1.0, 0.9, 0.65) * glow
      + vec3(1.0, 0.78, 0.5) * halo;

    float alpha = clamp(core + glow + halo, 0.0, 1.0);
    gl_FragColor = vec4(color, alpha);
  }
`;
