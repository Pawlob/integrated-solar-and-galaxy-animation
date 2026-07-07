/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Device-aware texture quality. Two hard realities:
 *  1. Many mobile GPUs (notably iPhones) cap textures at 4096px — an 8K
 *     map would fail or be silently degraded there.
 *  2. Even where 8K is supported, small screens can't show the extra
 *     detail; the decode cost and memory are pure waste on a phone.
 */

import type { WebGLRenderer } from 'three';

export type TextureQuality = '8k' | '2k';

const MIN_EFFECTIVE_WIDTH_FOR_8K = 2200;
const MIN_DEVICE_MEMORY_GB_FOR_8K = 8;

type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
};

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: NetworkInformationLike;
};

function isSlowConnection(connection?: NetworkInformationLike): boolean {
  if (!connection?.effectiveType) return false;
  return ['slow-2g', '2g', '3g'].includes(connection.effectiveType);
}

export function pickTextureQuality(gl: WebGLRenderer): TextureQuality {
  const maxTextureSize = gl.capabilities.maxTextureSize;
  if (maxTextureSize < 8192) return '2k';

  const forced = new URLSearchParams(window.location.search).get('quality');
  if (forced === '2k' || forced === '8k') return forced;

  const navigatorHints = window.navigator as NavigatorWithHints;
  if (navigatorHints.connection?.saveData) return '2k';
  if (isSlowConnection(navigatorHints.connection)) return '2k';

  if (
    typeof navigatorHints.deviceMemory === 'number' &&
    navigatorHints.deviceMemory < MIN_DEVICE_MEMORY_GB_FOR_8K
  ) {
    return '2k';
  }

  const devicePixelRatio = window.devicePixelRatio || 1;
  const effectiveWidth =
    Math.max(window.innerWidth, window.innerHeight) * devicePixelRatio;
  return effectiveWidth < MIN_EFFECTIVE_WIDTH_FOR_8K ? '2k' : '8k';
}
