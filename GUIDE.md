# 🌍 LUNA — Developer Guide

**Read this before you build anything.** This project looks simple (a spinning Earth and a Moon) but it works because a small set of rules is never broken. Follow the rules and anything you add — Mars, Saturn, the whole solar system — will look as real as what's already here. Break them and things will look "off" in ways that are hard to debug.

---

## 1. The Philosophy (why this scene looks real)

Everything in this scene obeys **three laws**:

1. **There is exactly ONE sun.** Every object is lit by the same fixed direction (`SUN_DIRECTION`). Phases, terminators, glints, shadows — none of them are painted or faked. They *emerge* from geometry meeting that one light. This is why the Moon's phases are always correct and why nothing ever looks pasted-on.
2. **Sizes are TRUE, distances are cinematic.** The Moon really is 27% of Earth's diameter here. But its distance is compressed (reality is 30 Earth-diameters — a boring dot). Every cheat like this is *deliberate and documented in a comment*. Never cheat silently.
3. **Time is one shared clock.** All motion derives from `clock.elapsedTime` plus the user's drag offset (`spinState.offset`). Dragging doesn't move objects — it scrubs *time itself*, so every body advances in honest proportion.

If a change you're planning violates one of these, stop and reconsider.

---

## 2. Map of the Code

```
src/
├── App.tsx                      # Page shell: CSS photo backdrop + transparent Canvas
├── lib/
│   ├── scene-constants.ts       # ⭐ EVERY tunable number lives here. No magic numbers in components.
│   ├── spin-state.ts            # Shared drag-to-spin (time scrub) state
│   ├── texture-quality.ts       # Picks 8K vs 2K textures per device GPU/screen
│   └── asset-url.ts             # textureUrl() — base-aware paths (NEVER hardcode /textures/...)
├── components/
│   ├── scene/CameraRig.tsx      # Responsive framing: fits the scene on ANY screen shape
│   ├── earth/
│   │   ├── Earth.tsx            # 3 nested layers: surface, clouds, atmosphere
│   │   ├── earth-shaders.ts     # Day/night blend, ocean glint, cloud shadows, limb haze
│   │   ├── cloud-shaders.ts     # Lit cloud shell with limb fade
│   │   └── atmosphere-shaders.ts# Additive rim halo (BackSide shell)
│   └── moon/
│       ├── Moon.tsx             # Orbit + tidal lock
│       └── moon-shaders.ts      # Airless-body lighting (YOUR TEMPLATE for new rocky bodies)
public/textures/                 # All maps. Each body: high-res + 2K pair.
```

**The most important file is `scene-constants.ts`.** Read it top to bottom before changing anything. Every constant has a comment explaining the physics or the artistic choice.

---

## 3. The Golden Rules (DO / DON'T)

### Lighting
- ✅ **DO** import `SUN_DIRECTION` from scene-constants and pass it as a uniform to every new body's shader.
- ✅ **DO** compute lighting per-fragment as `dot(worldNormal, uSunDirection)` — copy the pattern from `moon-shaders.ts`.
- ❌ **DON'T** ever add a `<directionalLight>`, `<pointLight>`, or a second sun uniform with a different value. One scene, one sun. (Your AI-generated reference images always get this wrong — we never do.)
- ❌ **DON'T** use Three.js built-in materials (`meshStandardMaterial`) for celestial bodies — they need scene lights and won't match our shader lighting. Custom `shaderMaterial` only.

### Two lighting recipes — pick per body type
| Body type | Recipe | Template |
|---|---|---|
| **Airless rock** (Moon, Mercury, asteroids) | Hard lambert `pow(dayStrength, ~0.95)`, NEUTRAL terminator (no warm tint — no air = no red sunsets!), sharp limb, no halo. Optional: faint "planetshine" floor. | `moon-shaders.ts` |
| **Atmospheric world** (Earth, Mars, Venus, gas giants) | Softer lambert, warm tint on grazing light (`lowSun` pattern), fresnel limb haze in the body's atmosphere color, separate additive BackSide halo shell. | `earth-shaders.ts` + `atmosphere-shaders.ts` |

Mars example: thin CO₂ atmosphere → *subtle* dusty-orange haze, tiny halo. Venus: thick → strong haze, cloud shell IS the surface you see.

### Motion & time
- ✅ **DO** drive all rotation/orbits as `INITIAL + clock.elapsedTime * SPEED + spinState.offset * (YOUR_SPEED / EARTH_ROTATION_SPEED)` — absolute, from elapsed time. See `Moon.tsx`.
- ❌ **DON'T** accumulate rotation with `+=` per frame (drifts, breaks on re-render) and **DON'T** ignore `spinState` — every body must respond to the user's time-scrub or the illusion of one universe dies.
- ✅ **DO** keep real *ratios* between periods (our scale: Earth day = 2 min; Moon orbit = 27.3 days ≈ 55 min real-ratio, we run 6 min cinematic — documented!).

### Sizes & distances
- ✅ **DO** use true diameter ratios. Earth = 2.3 units is the anchor. Scale table below.
- ✅ **DO** compress orbital distances cinematically — but write the real number in a comment next to the cheat.
- ❌ **DON'T** cheat a SIZE. Users forgive compressed distance; wrong proportions read as "toy".

### Constants & code
- ✅ **DO** put every new number in `scene-constants.ts` with a comment. Name per convention: `MARS_RADIUS`, `MARS_ORBIT_SPEED`…
- ❌ **DON'T** hardcode numbers, colors, or paths inside components/shaders.
- ✅ **DO** one small step at a time, verify visually, then the next step. This whole project was built that way.
- ✅ **DO** run `npx tsc --noEmit` after every change. A GLSL error shows up as red `THREE.WebGLProgram` errors in the browser console — check it after every shader edit.

### Textures
- ✅ **DO** use **equirectangular** maps only — 2:1 aspect (e.g. 4096×2048), the "unwrapped peel". Anything else won't wrap a sphere correctly.
- ✅ **DO** get maps from: solarsystemscope.com/textures (all planets, CC-BY), NASA Visible Earth / SVS CGI Kits (public domain). Never AI-generate planet textures — AI invents fake geography.
- ✅ **DO** provide a **pair** per body: high-res + `_2k` version, loaded via the `quality` suffix (see `Earth.tsx`) — phones and iOS GPUs (4096px texture limit!) depend on the 2K path.
- ✅ **DO** optimize before shipping: 4K is enough for anything smaller than half the screen; JPEG quality 80–85; the Pillow one-liner used here shrank the Moon 15 MB → 2.3 MB with zero visible loss.
- ⚠️ **MEASURE new textures** — some downloads are "born dark" (our Milky Way panorama averaged 1/255 brightness and was invisible). Open it, look at it, know what you're loading.
- ❌ **DON'T** reference textures as `/textures/foo.jpg` — always `textureUrl('foo.jpg')` (deploys break otherwise; GitHub Pages serves under a subpath).

### The camera
- ✅ **DO** extend `getSceneFrameRadius()` in scene-constants when you add a body that orbits wider than the Moon — the CameraRig automatically keeps the whole system framed on every device.
- ❌ **DON'T** move, animate, or hand-position the camera per-device. One rule, one function, all screens.

---

## 4. Worked Example: Adding Mars (follow this recipe for ANY body)

1. **Textures.** Download `2k_mars.jpg` and (optionally) `8k_mars.jpg` from Solar System Scope into `public/textures/` as `mars_2k.jpg` / `mars_8k.jpg`. Optimize the 8K (→4K, q82).
2. **Constants** in `scene-constants.ts`:
   ```ts
   /** Mars: true ratio — 53% of Earth's diameter. */
   export const MARS_RADIUS = EARTH_RADIUS * 0.53;
   /** Real distance is ~1400 earth-radii; compressed for the frame. */
   export const MARS_ORBIT_RADIUS = 14;
   /** Mars day ≈ 24.6h ≈ Earth's. Mars year = 687 days (scale it honestly or document the cheat). */
   export const MARS_ROTATION_SPEED = EARTH_ROTATION_SPEED * (24 / 24.6);
   ```
3. **Component.** Copy `components/moon/` → `components/mars/`. Mars is airless-ish but dusty: start from the moon shader, add a *subtle* warm `lowSun` tint and a faint dusty-orange fresnel (thin atmosphere).
4. **Motion.** Orbit + self-rotation, both from `clock.elapsedTime`, both coupled to `spinState.offset`. Mars is NOT tidally locked — it spins freely, so give it its own `rotation.y` like Earth's, not the Moon's lock.
5. **Register** in `App.tsx` inside `<Suspense>`.
6. **Frame it.** If it orbits wider than the Moon, update `getSceneFrameRadius()`.
7. **Verify:** `tsc` → console clean → look at it: lit from the SAME side as Earth? Phase-correct when opposite the sun? Fully in frame on a phone-sized window?

---

## 5. Scale Reference Table (Earth = 2.3 units)

| Body | Real diameter vs Earth | Radius in units | Notes |
|---|---|---|---|
| Sun | 109× | 250 (special!) | Don't render as a normal body — see below |
| Mercury | 0.38× | 0.88 | Airless — moon recipe |
| Venus | 0.95× | 2.19 | You only ever see its cloud deck |
| **Earth** | 1× | **2.3** | The anchor |
| Moon | 0.27× | 0.62 | Already built |
| Mars | 0.53× | 1.22 | Thin atmosphere |
| Jupiter | 11.2× | 25.8 | Huge — will dominate any frame it's in |
| Saturn | 9.4× | 21.7 | Rings: flat `ringGeometry` + alpha texture, tilted 27° |
| Uranus / Neptune | ~4× | ~9.2 | Ice giants, subtle banding |

**Distances (the honest problem):** at true scale Neptune orbits ~30,000 units away. NOBODY renders the solar system at true distance — every visualization compresses. Two respectable options:
- **Log-scale compression:** `displayDistance = k * ln(realDistance)` — keeps ORDER and relative feel.
- **Per-shot framing:** don't show everything at once; let the camera travel between bodies (this is what the scroll journey is for).

**The Sun, if you build it:** it is not a lit object — it IS the light. Render it as an emissive sphere (`gl_FragColor` at full brightness, no lighting math) + additive glow shells, placed far away *in the exact direction of `SUN_DIRECTION`* so the lighting story stays consistent. Never let its position contradict the light direction.

---

## 6. Performance Budget (keep it 60fps on a phone)

- **Texture memory is the killer**, not geometry. GPU cost = width × height × 4 bytes (JPEG size is irrelevant once decoded!). An 8K map = 134 MB of VRAM. Rule: 4K max per new body, 2K for the mobile pair.
- Sphere geometry is cheap: 96–128 segments is plenty; don't exceed.
- No allocations inside `useFrame` — no `new Vector3()` per frame; reuse refs (see existing components).
- Transparent layers (clouds, halos): `depthWrite={false}`, keep the count low — overdraw hurts phones.
- DPR is already capped at 2 in App.tsx. Don't raise it.
- After adding assets, run the size check: `npm run build` then look at `dist/` — the whole site should stay **under ~25 MB** (it's 17 MB today).

---

## 7. Known Traps (we hit every one of these — learn from our bruises)

1. **Vite HMR ghosts.** After renaming/moving constants, the browser can hold a broken half-state ("does not provide an export named…"). Fix: hard-refresh. If the scene silently won't load textures: `rm -rf node_modules/.vite` and restart the dev server.
2. **The tab-hidden render pause.** Browsers suspend `requestAnimationFrame` in background tabs — the scene freezes and pixel tests read black. Not a bug.
3. **Screenshot tools time out** on the endlessly-animating canvas. Verify with your eyes or with `readPixels` inside a `requestAnimationFrame`.
4. **Dark-texture trap.** Measure a new texture's brightness before blaming your shader.
5. **Additive glow clipping.** If a glow/glint "turns white", the color channels are clipping — *reduce intensity* to let the color show (that's how the golden ocean glint got its gold).
6. **Texture edge-crust at the limb.** Any shell slightly larger than a body (clouds) shows as a detached crust at the edge — fade it out at grazing view angles (see `limbFade` in cloud-shaders).
7. **East/west confusion.** Earth turns west→east; on screen (north up) continents drift LEFT→RIGHT and the *evening* terminator is wherever you put the sun's opposite side. Draw the top-down diagram before reasoning about direction. The night side of the visible disk is always toward the east.

---

## 8. Pre-Build Checklist (review EVERY time before you build)

```
□ Do I have an equirectangular (2:1) texture pair (hi-res + 2K) from a real source?
□ Did I measure/optimize the textures (≤4K, JPEG q80-85)?
□ Are ALL my new numbers in scene-constants.ts with comments?
□ True size ratio? Distance cheat documented?
□ Does my shader read SUN_DIRECTION (the one sun)?
□ Airless recipe or atmospheric recipe — did I pick consciously?
□ Is motion driven by clock.elapsedTime + spinState coupling?
□ Does getSceneFrameRadius() still cover the widest orbit?
□ textureUrl() for every asset path?
□ tsc clean? Browser console clean? Looks right from phone-shaped window?
□ One change at a time, verified visually before the next?
```

---

## 9. Running & Deploying

```bash
npm install          # once
npm run dev          # local dev at :3000 (also on your LAN for phone testing)
npx tsc --noEmit     # type check — run constantly
npm run build        # production build into dist/
```

Deploy: the repo has a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and publishes to GitHub Pages on every push to `main`. Alternatively drag `dist/` onto netlify.com/drop. All asset paths are relative (`base: './'`) so the build runs anywhere.

---

*Built with one sun, true ratios, and a lot of pixel-measuring. Keep it that way.* 🌍🌙
