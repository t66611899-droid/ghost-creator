# Pro Max Design — Blubarber Design System (LOCKED)

## Identity

Ghost Creator looks like a **premium creative agency tool** from 2027.
Not a startup. Not a SaaS template. A weapon.

---

## LOCKED: Blubarber Palette

```css
/* HARD CONSTRAINTS — deviation requires explicit override comment */
--carbon:        #0A0A0A;  /* Page backgrounds — ONLY this, never gray-900 */
--carbon-2:      #0D0D0D;  /* Card surfaces */
--carbon-3:      #111111;  /* Elevated surfaces */
--border-dim:    #1E1E1E;  /* Default borders (legacy) */
--border-glass:  rgba(255,255,255,0.08); /* Glass borders (preferred) */
--orange:        #EA580C;  /* PRIMARY ACCENT — all active states */
--orange-hover:  #C2410C;  /* Orange hover */
--orange-glow:   rgba(234,88,12,0.08); /* Orange wash */
--white:         #FFFFFF;  /* Primary text */
--muted-60:      rgba(255,255,255,0.60); /* Secondary text */
--muted-30:      rgba(255,255,255,0.30); /* Tertiary text */
--muted-15:      rgba(255,255,255,0.15); /* Disabled / placeholder */
```

**BANNED COLORS**: Any purple, teal, blue, green, pink used as primary accent.
**BANNED PATTERNS**: `bg-gray-*`, `bg-blue-*`, `bg-gradient-to-r from-blue-*`.

---

## Glassmorphism System (Z-Layers)

```
Z0 — Page:      #0A0A0A solid
Z1 — Panel:     bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]
Z2 — Card:      bg-white/[0.06] backdrop-blur-2xl border border-white/[0.10]
Z3 — Float:     bg-white/[0.08] backdrop-blur-3xl border border-white/[0.14]
                + drop-shadow(0 32px 80px rgba(0,0,0,0.8))
                + shadow-[0_0_60px_rgba(234,88,12,0.08)]
Z4 — Modal:     bg-[#0D0D0D]/90 backdrop-blur-3xl
Z5 — Toast:     bg-white/[0.1] backdrop-blur-2xl border border-white/[0.15]
```

---

## Motion System (Spring Physics ONLY)

```typescript
// ALL transitions must use one of these — no cubic-bezier, no 'ease'
const transitions = {
  // UI standard — card reveals, panels
  standard: { type: 'spring', stiffness: 100, damping: 20 } as Transition,

  // Fast — hover micro-interactions, button feedback
  fast:     { type: 'spring', stiffness: 300, damping: 30 } as Transition,

  // Slow — 3D entrances, hero animations
  slow:     { type: 'spring', stiffness: 60,  damping: 18 } as Transition,

  // Snappy — dropdown, tooltip
  snap:     { type: 'spring', stiffness: 500, damping: 40 } as Transition,
};
```

CSS `transition` allowed for: `color`, `opacity`, `border-color`, `background-color` only.

---

## Typography Scale

```
Brand:    font-black tracking-tight (Geist)
H1:       text-5xl font-black leading-none tracking-tight
H2:       text-3xl font-black leading-tight
H3:       text-xl  font-black leading-snug
Body:     text-sm  font-normal text-white/60 leading-relaxed
Caption:  text-xs  font-medium text-white/30
Label:    text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30
Mono:     font-mono text-[11px] text-white/30 (Geist Mono)
Hebrew:   font-[family-name:var(--font-rubik)] font-black dir="rtl"
```

---

## Component Signatures (copy verbatim)

### Primary CTA
```tsx
className="bg-[#EA580C] hover:bg-[#C2410C] text-white font-black text-sm
           uppercase tracking-widest py-3.5 px-8 rounded-xl cursor-pointer
           shadow-lg shadow-[#EA580C]/20 transition-colors"
```

### Ghost Button
```tsx
className="backdrop-blur-sm bg-white/[0.04] hover:bg-white/[0.08] border
           border-white/[0.08] hover:border-white/[0.16] text-white/50
           hover:text-white text-sm font-semibold rounded-xl px-6 py-3
           transition-colors cursor-pointer"
```

### Orange Badge
```tsx
className="text-[10px] font-bold text-[#EA580C] bg-[#EA580C]/10
           border border-[#EA580C]/20 rounded-full px-2.5 py-0.5
           uppercase tracking-wider"
```

### Glass Card
```tsx
className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08]
           rounded-2xl shadow-[0_0_40px_rgba(234,88,12,0.06)]"
```

---

## 3D Rules

- All R3F: `next/dynamic ssr: false` — no exceptions
- Background scenes: `frameloop="always"`, `gl={{ alpha: true }}`
- Interactive scenes: `frameloop="demand"`
- Camera default: `position={[0, 0, 2.8]} fov={45}`
- Always include a `<ambientLight intensity={0.08} />` minimum
- Orange point light: `color="#EA580C"` — mandatory in hero scenes
- Never use `MeshStandardMaterial` without `roughness` and `metalness` set
- Holographic: `MeshBasicMaterial` wireframe + transparent layers

---

## Forbidden UI Patterns

- Generic SaaS blue/purple gradient hero (`from-blue-* to-purple-*`) — PURGE ON SIGHT
- `bg-gray-*` — replace with `bg-white/[0.0x]` glass equivalent
- `rounded-lg` on cards — use `rounded-2xl` or `rounded-3xl`
- `border-gray-*` — replace with `border-white/[0.0x]`
- `text-gray-*` — replace with `text-white/[0.x]`
- Feature cards with colored icons on dark cards — use orange-tinted icon boxes only
- Pricing sections on the landing page (not our product model)
- Footer with lots of links — single-line footer max
