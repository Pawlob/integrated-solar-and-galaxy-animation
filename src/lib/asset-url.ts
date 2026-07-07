/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Base-aware asset URLs. The site may be hosted under a subpath (e.g.
 * GitHub Pages serves at /repo-name/), so texture paths must never be
 * hardcoded absolute. Vite injects the correct base at build time.
 */

export function textureUrl(fileName: string): string {
  return `${import.meta.env.BASE_URL}textures/${fileName}`;
}

export function modelUrl(fileName: string): string {
  return `${import.meta.env.BASE_URL}models/${fileName}`;
}
