/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The living book. The 3D sky (earth, moon, stars) is a FIXED background;
 * the story scrolls over it in frosted-glass panels. Scrolling drives the
 * scene itself — the camera swings from dawn toward full daylight while
 * time runs faster (earth spins, moon advances) — see CameraRig.
 */

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Earth } from './components/earth/Earth';
import { Moon } from './components/moon/Moon';
import { Stars } from './components/sky/Stars';
import { Sun } from './components/sun/Sun';
import { CameraRig } from './components/scene/CameraRig';
import { Reveal } from './components/ui/Reveal';
import { CAMERA_FOV, CAMERA_POSITION } from './lib/scene-constants';
import { textureUrl } from './lib/asset-url';
import { scrollState } from './lib/scroll-state';
import { useSpinDrag } from './lib/use-spin-drag';

function useScrollProgress() {
  useEffect(() => {
    const update = () => {
      // Pages scrolled (viewport-heights), unbounded — the camera orbits
      // a fixed slice per page whether the book has 7 pages or 100.
      scrollState.pages = Math.max(0, window.scrollY / window.innerHeight);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
}

// Phones: a solid dark tint, NO backdrop-blur. Blurring live pixels
// behind a continuously-animating WebGL canvas is one of the most
// expensive things a mobile GPU can be asked to do every frame — this
// was the single biggest cause of scroll jank. Desktop has GPU headroom
// to spare, so it keeps the full frosted-glass look.
const GLASS_PANEL =
  'max-w-sm md:max-w-md rounded-2xl border border-white/15 bg-black/45 md:bg-white/[0.07] md:backdrop-blur-md p-6 md:p-8 shadow-2xl';

const NARROW_VIEWPORT_QUERY = '(max-width: 767px)';

/**
 * Phones can report a device pixel ratio up to 3, and every extra pixel
 * of density means MORE fragment-shader work for a continuously-animating
 * full-bleed scene. Capping the max at 1.5 instead of 2 on narrow screens
 * cuts that per-frame GPU cost by ~44% — barely visible on a small
 * screen, but a large real win for scroll smoothness.
 */
function useResponsiveDpr(): [number, number] {
  const getDpr = (): [number, number] =>
    typeof window !== 'undefined' &&
    window.matchMedia(NARROW_VIEWPORT_QUERY).matches
      ? [1, 1.5]
      : [1, 2];

  const [dpr, setDpr] = useState<[number, number]>(getDpr);

  useEffect(() => {
    const mediaQuery = window.matchMedia(NARROW_VIEWPORT_QUERY);
    const update = () => setDpr(getDpr());
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  return dpr;
}

export default function App() {
  const { onPointerDownCapture } = useSpinDrag();
  useScrollProgress();
  const dpr = useResponsiveDpr();

  return (
    <div className="relative w-full font-sans">
      {/* Deep-space photo backdrop, fixed at native resolution. */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{
          backgroundImage: `url(${textureUrl('space_background.jpg')})`,
          backgroundColor: '#7a7a7a',
          backgroundBlendMode: 'multiply',
        }}
      />

      {/* The living sky, fixed behind the story. touch-pan-y lets vertical
          swipes scroll the page while horizontal drags spin the globe. */}
      <div
        className="fixed inset-0 z-0 cursor-grab active:cursor-grabbing touch-pan-y select-none"
        onPointerDownCapture={onPointerDownCapture}
      >
        <Canvas
          camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
          dpr={dpr}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <CameraRig />
          <Stars />
          <Sun />
          <Suspense fallback={null}>
            <Earth />
            <Moon />
          </Suspense>
        </Canvas>
        <Loader
          containerStyles={{ background: 'transparent', zIndex: 10 }}
          innerStyles={{
            background: 'rgba(0, 0, 0, 0.55)',
            width: '280px',
            padding: '12px 20px',
            borderRadius: '8px',
          }}
          barStyles={{ background: '#3b82f6' }}
          dataStyles={{
            color: '#e5e7eb',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
          }}
          dataInterpolation={(p) => `Loading Earth & Moon… ${p.toFixed(0)}%`}
        />
      </div>

      {/* The story. Panels catch the pointer; everything else falls
          through to the sky so dragging the planet still works. */}
      <main className="relative z-10 pointer-events-none">
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <Reveal>
            <p className="text-xs md:text-sm tracking-[0.45em] text-white/60 mb-5">
              A LIVING BOOK
            </p>
            <h1 className="text-6xl md:text-8xl font-light text-white tracking-[0.2em]">
              LUNA
            </h1>
            <p className="mt-6 text-white/70 font-light max-w-md mx-auto leading-relaxed">
              A story written across the sky — read it as the world turns.
            </p>
          </Reveal>
          <div className="absolute bottom-10 text-white/50 text-sm tracking-widest animate-bounce">
            scroll ↓
          </div>
        </section>

        {/* On phones the panels sit low so the planet stays visible above
            the words; on desktop they float beside the scene. */}
        <section className="min-h-screen flex items-end pb-16 md:items-center md:pb-0 justify-start px-6 md:px-24">
          <Reveal className={GLASS_PANEL}>
            <p className="text-xs tracking-[0.35em] text-sky-300/80 mb-3">
              CHAPTER ONE
            </p>
            <h2 className="text-3xl font-light text-white mb-4">
              The Blue Marble
            </h2>
            <p className="text-white/75 font-light leading-relaxed">
              Your opening chapter lives here. As the reader scrolls, a new
              day sweeps across the planet behind these words — cities wake,
              clouds drift, and the story begins where every story does: at
              dawn.
            </p>
          </Reveal>
        </section>

        <section className="min-h-screen flex items-end pb-16 md:items-center md:pb-0 justify-end px-6 md:px-24">
          <Reveal className={GLASS_PANEL}>
            <p className="text-xs tracking-[0.35em] text-amber-200/80 mb-3">
              CHAPTER TWO
            </p>
            <h2 className="text-3xl font-light text-white mb-4">
              Into the Shadow
            </h2>
            <p className="text-white/75 font-light leading-relaxed">
              You are crossing the planet's night now — a ring of atmosphere
              and a web of golden cities against the black. And beyond the
              dark edge of the world, something has begun to burn.
            </p>
          </Reveal>
        </section>

        <section className="min-h-screen flex items-end pb-16 md:items-center md:pb-0 justify-start px-6 md:px-24">
          <Reveal className={GLASS_PANEL}>
            <p className="text-xs tracking-[0.35em] text-emerald-300/80 mb-3">
              CHAPTER THREE
            </p>
            <h2 className="text-3xl font-light text-white mb-4">
              The Turning World
            </h2>
            <p className="text-white/75 font-light leading-relaxed">
              Notice the continents drifting past — a whole day passes while
              a chapter is read. Somewhere below, the sun is climbing over a
              coastline; somewhere else, golden cities are switching on for
              the night.
            </p>
          </Reveal>
        </section>

        <section className="min-h-screen flex items-end pb-16 md:items-center md:pb-0 justify-end px-6 md:px-24">
          <Reveal className={GLASS_PANEL}>
            <p className="text-xs tracking-[0.35em] text-violet-300/80 mb-3">
              CHAPTER FOUR
            </p>
            <h2 className="text-3xl font-light text-white mb-4">
              The Silver Companion
            </h2>
            <p className="text-white/75 font-light leading-relaxed">
              While you read, the moon has been moving — patient, tidally
              faithful, always showing the same face. By this chapter it has
              carried its phases a little further around the world below.
            </p>
          </Reveal>
        </section>

        <section className="min-h-screen flex items-end pb-16 md:items-center md:pb-0 justify-start px-6 md:px-24">
          <Reveal className={GLASS_PANEL}>
            <p className="text-xs tracking-[0.35em] text-rose-300/80 mb-3">
              CHAPTER FIVE
            </p>
            <h2 className="text-3xl font-light text-white mb-4">
              The Golden Sea
            </h2>
            <p className="text-white/75 font-light leading-relaxed">
              The night is behind you now — watch the ocean below. There is
              a place where the sea turns to gold: the sun itself, reflected
              back at you across a hundred million miles of water.
            </p>
          </Reveal>
        </section>

        <section className="min-h-screen flex items-end pb-16 md:items-center md:pb-0 justify-end px-6 md:px-24">
          <Reveal className={GLASS_PANEL}>
            <p className="text-xs tracking-[0.35em] text-cyan-300/80 mb-3">
              CHAPTER SIX
            </p>
            <h2 className="text-3xl font-light text-white mb-4">
              Stardust Trails
            </h2>
            <p className="text-white/75 font-light leading-relaxed">
              Look past the planet's edge — the sky itself is drifting.
              Near motes stream by quickly, far stars barely shift: two
              depths of dust, moving at the speed of your own scrolling
              hand.
            </p>
          </Reveal>
        </section>

        <section className="min-h-screen flex items-end pb-16 md:items-center md:pb-0 justify-start px-6 md:px-24">
          <Reveal className={GLASS_PANEL}>
            <p className="text-xs tracking-[0.35em] text-orange-300/80 mb-3">
              CHAPTER SEVEN
            </p>
            <h2 className="text-3xl font-light text-white mb-4">
              The Tilted Orbit
            </h2>
            <p className="text-white/75 font-light leading-relaxed">
              The moon does not circle flat around us — its path leans five
              degrees off true, an old inheritance from the world's own
              birth. That small tilt is the only reason the sun is not
              eclipsed every single month.
            </p>
          </Reveal>
        </section>

        <section className="min-h-screen flex items-end pb-16 md:items-center md:pb-0 justify-end px-6 md:px-24">
          <Reveal className={GLASS_PANEL}>
            <p className="text-xs tracking-[0.35em] text-teal-300/80 mb-3">
              CHAPTER EIGHT
            </p>
            <h2 className="text-3xl font-light text-white mb-4">
              Perigee
            </h2>
            <p className="text-white/75 font-light leading-relaxed">
              Watch for the moment the moon swings nearest — larger,
              brighter, hurrying past. This is perigee, the close point of
              an ellipse, where Kepler's old law makes it race rather than
              drift.
            </p>
          </Reveal>
        </section>

        <section className="min-h-screen flex items-end pb-16 md:items-center md:pb-0 justify-start px-6 md:px-24">
          <Reveal className={GLASS_PANEL}>
            <p className="text-xs tracking-[0.35em] text-fuchsia-300/80 mb-3">
              CHAPTER NINE
            </p>
            <h2 className="text-3xl font-light text-white mb-4">
              Apogee
            </h2>
            <p className="text-white/75 font-light leading-relaxed">
              And then the far side of the same ellipse — smaller now,
              unhurried, taking its time along the outer curve of its path.
              Near or far, it never once turns its face away from home.
            </p>
          </Reveal>
        </section>

        <section className="min-h-screen flex items-end pb-16 md:items-center md:pb-0 justify-end px-6 md:px-24">
          <Reveal className={GLASS_PANEL}>
            <p className="text-xs tracking-[0.35em] text-lime-300/80 mb-3">
              CHAPTER TEN
            </p>
            <h2 className="text-3xl font-light text-white mb-4">
              The Second Dawn
            </h2>
            <p className="text-white/75 font-light leading-relaxed">
              The camera has come full circle before, and it will again —
              the world does not end at any one page. Somewhere below, a
              coastline is meeting the sun for a morning it does not know
              is being watched.
            </p>
          </Reveal>
        </section>

        <section className="min-h-screen flex items-end pb-16 md:items-center md:pb-0 justify-start px-6 md:px-24">
          <Reveal className={GLASS_PANEL}>
            <p className="text-xs tracking-[0.35em] text-indigo-300/80 mb-3">
              CHAPTER ELEVEN
            </p>
            <h2 className="text-3xl font-light text-white mb-4">
              City Lights
            </h2>
            <p className="text-white/75 font-light leading-relaxed">
              Lean closer to the dark side and the glow resolves into
              threads — coastlines, rivers, the outlines of places full of
              people who will never see this view, only live inside it.
            </p>
          </Reveal>
        </section>

        <section className="min-h-screen flex items-end pb-16 md:items-center md:pb-0 justify-end px-6 md:px-24">
          <Reveal className={GLASS_PANEL}>
            <p className="text-xs tracking-[0.35em] text-pink-300/80 mb-3">
              CHAPTER TWELVE
            </p>
            <h2 className="text-3xl font-light text-white mb-4">
              The Wandering Face
            </h2>
            <p className="text-white/75 font-light leading-relaxed">
              Even a face that always points home is not perfectly still —
              it wobbles a few patient degrees each orbit, a slow nod
              called libration, too small to notice in a single glance.
            </p>
          </Reveal>
        </section>

        <section className="min-h-screen flex items-end pb-16 md:items-center md:pb-0 justify-start px-6 md:px-24">
          <Reveal className={GLASS_PANEL}>
            <p className="text-xs tracking-[0.35em] text-yellow-200/80 mb-3">
              CHAPTER THIRTEEN
            </p>
            <h2 className="text-3xl font-light text-white mb-4">
              Horizon Line
            </h2>
            <p className="text-white/75 font-light leading-relaxed">
              The last page is close now, and the light is close behind it.
              Every chapter before this one was a single lap of an orbit
              that never actually stops — only the reading does.
            </p>
          </Reveal>
        </section>

        <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-light text-white tracking-[0.15em] mb-6">
              To be continued…
            </h2>
            <p className="text-white/60 font-light max-w-md mx-auto leading-relaxed">
              The journey that began at dawn ends in full daylight. Your
              book starts here.
            </p>
            <p className="mt-10 text-[11px] tracking-wide text-white/35">
              Imagery: NASA · Textures: Solar System Scope (CC BY 4.0)
            </p>
          </Reveal>
        </section>
      </main>
    </div>
  );
}
