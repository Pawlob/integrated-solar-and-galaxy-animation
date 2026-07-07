/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Twinkling star points. Positions are fixed (no drift, no rotation —
 * only per-star brightness breathes) so the field reads as distant and
 * still, exactly like the sky itself.
 */

export const starVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute vec3 aColor;

  uniform float uTime;
  // gl_PointSize is in DEVICE pixels. Phones render at a much higher
  // pixel density than desktop, so without this compensation the exact
  // same point shrinks to sub-pixel and disappears on mobile.
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vColor = aColor;
    vTwinkle = 0.7 + 0.3 * sin(uTime * aSpeed + aPhase);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // Hard floor of 1 device pixel: guarantees a mote is never sized
    // into invisibility, whatever the distance or pixel ratio.
    gl_PointSize = max(1.0, aSize * (180.0 / -mvPosition.z) * uPixelRatio);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const starFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec2 offset = gl_PointCoord - 0.5;
    float dist = length(offset);
    float alpha = smoothstep(0.5, 0.08, dist);
    gl_FragColor = vec4(vColor * vTwinkle, alpha * vTwinkle);
  }
`;
