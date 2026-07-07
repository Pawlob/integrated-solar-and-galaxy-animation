/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared scroll position measured in PAGES scrolled (viewport-heights),
 * unbounded — a 7-page story or a 100-page book both just keep orbiting.
 * Written by the page's scroll listener, read by the render loop every
 * frame — same mutable singleton pattern as spin-state.
 */

export const scrollState = {
  pages: 0,
};
