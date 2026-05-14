# R3F Scrollytelling — Parallax Path Rules

## Mission

Ghost Creator's hero feels alive. The Holographic Sphere is a character —
it tracks the user's scroll like a puppet on glass strings, transitioning
through three discrete states that frame the page's narrative.

---

## The Parallax Path (LOCKED)

Scroll offset is normalized to `[0, 1]` across the document body.
Three discrete acts drive the sphere's behavior:

### Act 1 — Sphere Center (offset 0 → 0.3)
```
position:    [0, 0, 0]         // dead center
scale:       1.0
rotation.y:  offset * 0.4      // gentle drift left-to-right
opacity:     1.0
intent:      "I am the brand. I am alive."
```

### Act 2 — Scale Up & Rotate (offset 0.3 → 0.6)
```
t = (offset - 0.3) / 0.3        // local 0→1 within this act
position:    [0, 0, 0]
scale:       lerp(1.0, 1.6, t)
rotation.y:  0.12 + t * 1.4     // dramatic spin
rotation.x:  t * 0.35           // slight tilt
opacity:     1.0
intent:      "I am at maximum presence. Look at the strategy."
```

### Act 3 — Move to Background (offset 0.6 → 1.0)
```
t = (offset - 0.6) / 0.4
position:    [lerp(0, 1.8, t), lerp(0, 0.6, t), lerp(0, -2.4, t)]
scale:       lerp(1.6, 0.7, t)
rotation.y:  1.52 + t * 0.4
opacity:     lerp(1.0, 0.35, t)  // recedes but never vanishes
intent:      "I am supporting the strategy grid in the background."
```

---

## Implementation Contract

```typescript
// Single source of truth for scroll offset
const scrollOffset = useScrollOffset(); // 0..1 via window scroll listener

// All three acts compose into one transform function
function parallaxState(offset: number): {
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
  opacity: number;
}
```

Sphere component must use `useFrame` to lerp toward the target state each frame.
Target = `parallaxState(currentScrollOffset)`. Lerp rate: 0.08 per frame (smooth).
**Never** snap directly to target — always interpolate.

---

## R3F Canvas Rules

```typescript
<Canvas
  camera={{ position: [0, 0, 5], fov: 50 }}
  style={{
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',   // critical — let content above receive clicks
  }}
  gl={{ antialias: true, alpha: true }}
  frameloop="always"
>
```

### Z-Layer System (HARD CONSTRAINT)
```
z-index 0   — R3F background canvas
z-index 10  — Page content (overflow-auto, captures scroll)
z-index 40  — GlobalSidebar (above 3D, always clickable)
z-index 50  — SuiteShell header (Reset trigger, breadcrumbs)
```

---

## Forbidden Patterns

- Mounting the R3F canvas inside a flex/grid child — must be `position: fixed`
- Allowing `pointer-events: auto` on the R3F canvas — kills sidebar clicks
- Using drei `<ScrollControls>` with hijacked scroll on shell pages — only landing page uses it
- Snapping sphere position discretely between acts — must interpolate smoothly
- Hard-coded scroll offset breakpoints other than 0.3 / 0.6 — those are LOCKED
