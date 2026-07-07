/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Scroll reveal: children fade up into place when they enter the
 * viewport, and reset when they leave — so the animation replays on
 * every pass through the story.
 */

import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

export function Reveal({ children, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        element.classList.toggle('reveal-visible', entry.isIntersecting);
      },
      { threshold: 0.35 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal pointer-events-auto ${className}`}>
      {children}
    </div>
  );
}
