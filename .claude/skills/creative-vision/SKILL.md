# Ghost Creator — Creative Vision Constraints

## Design Identity

Ghost Creator is a **professional creative agency suite** for short-form video content.
Every pixel must feel like it belongs in a 2026 Webby Award submission.

---

## Blubarber Palette (HARD CONSTRAINTS — do not deviate)

| Token | Hex | Usage |
|-------|-----|-------|
| `carbon` | `#0A0A0A` | All page backgrounds |
| `carbon-2` | `#0D0D0D` | Card surfaces |
| `carbon-3` | `#111111` | Elevated card surfaces |
| `border-dim` | `#1E1E1E` | Default borders |
| `border-mid` | `#2A2A2A` | Hover borders |
| `orange` | `#EA580C` | Primary accent — CTA, active states, glow |
| `orange-dim` | `#C2410C` | Orange hover |
| `orange-ghost` | `rgba(234,88,12,0.08)` | Orange wash backgrounds |
| `white` | `#FFFFFF` | Primary text |
| `muted-1` | `#888888` | Secondary text |
| `muted-2` | `#555555` | Tertiary text / labels |
| `muted-3` | `#333333` | Placeholder / disabled |

**HARD-DENY**: Generic AI purples (`#7C3AED`, `#8B5CF6`), teal (`#0D9488`), generic blues.
**HARD-DENY**: White backgrounds on dashboard. Ghost Creator is always dark.

---

## Motion Rules

All transitions use **spring physics**:

```typescript
// Standard spring — UI transitions, card reveals
const spring = { type: 'spring', stiffness: 100, damping: 20 };

// Fast spring — hover micro-interactions  
const fastSpring = { type: 'spring', stiffness: 300, damping: 30 };

// Slow spring — 3D / dramatic entrances
const slowSpring = { type: 'spring', stiffness: 60, damping: 18 };
```

**HARD-DENY**: `ease-in-out`, `linear`, `cubic-bezier` for primary transitions.
CSS `transition` utilities are allowed only for color/opacity (hover states).

---

## Glassmorphism Design System

All cards use the **Glass Layer** system:

```css
/* Layer 0 — Page */
background: #0A0A0A;

/* Layer 1 — Glass Card (standard) */
backdrop-filter: blur(20px);
background: rgba(255,255,255,0.04);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 16px;

/* Layer 2 — Glass Card (elevated) */
backdrop-filter: blur(24px);
background: rgba(255,255,255,0.07);
border: 1px solid rgba(255,255,255,0.12);
border-radius: 20px;

/* Orange Glow Accent */
box-shadow: 0 0 40px rgba(234,88,12,0.08), inset 0 1px 0 rgba(255,255,255,0.06);
```

Tailwind shorthands:
- Standard: `backdrop-blur-xl bg-white/5 border border-white/[0.08] rounded-2xl`
- Elevated: `backdrop-blur-2xl bg-white/[0.07] border border-white/[0.12] rounded-3xl`
- Orange accent card: add `shadow-[0_0_40px_rgba(234,88,12,0.08)]`

---

## Z-Axis Depth System

```
Z-Layer 0: Page background (#0A0A0A)
Z-Layer 1: Side panels (left/right columns)
Z-Layer 2: Main content cards (slight elevation with glass)
Z-Layer 3: 9:16 Video Preview panel (floats above grid)
Z-Layer 4: 3D Canvas overlays (sphere, globe)
Z-Layer 5: Modals, tooltips
Z-Layer 6: Toast notifications
```

---

## 3D Rules

- **All R3F canvases**: `next/dynamic` with `ssr: false`
- **Holographic Sphere**: Icosahedron wireframe + inner pulsing core. Glow intensity = `viralConfidence / 100`
- **Neural Globe**: Point cloud on sphere surface. Scan line sweeps during analysis.
- **Performance**: `frameloop="demand"` when static, `frameloop="always"` when animating

---

## Typography

```
Headlines: Geist (font-black, tracking-tight)
Body: Geist (default weight)
Hebrew: Rubik (weight 700/900, var(--font-rubik))
Monospace: Geist Mono (labels, metrics, code)
Label style: UPPERCASE, tracking-[0.15em], text-[10px], font-semibold
```

---

## Component Signatures

### CTA Button (primary)
```tsx
className="bg-[#EA580C] hover:bg-[#C2410C] text-white font-black text-sm uppercase tracking-widest 
           py-3.5 px-6 rounded-xl shadow-lg shadow-[#EA580C]/20 transition-colors"
```

### Ghost Button (secondary)
```tsx  
className="border border-white/10 bg-white/5 hover:bg-white/8 backdrop-blur-sm text-white/60 
           hover:text-white text-sm rounded-xl px-4 py-2.5 transition-colors"
```

### Metric Badge
```tsx
className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#555] 
           bg-black/40 border border-white/[0.06] rounded-lg px-2 py-1"
```
